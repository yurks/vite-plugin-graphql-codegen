import { CodegenContext, loadContext, generate } from '@graphql-codegen/cli';
import { normalizePath } from 'vite';
import { resolve } from 'node:path';

const isCodegenConfig = (filePath, configPath) => {
  if (!configPath)
    return false;
  return normalizePath(filePath) === normalizePath(configPath);
};
const isFileMatched = (filePath, lookupPaths) => {
  if (!lookupPaths.length)
    return false;
  const normalizedFilePath = normalizePath(filePath);
  return lookupPaths.includes(normalizedFilePath);
};

const modes = {
  serve: "serve",
  build: "build"
};
const { serve, build } = modes;
function isServeMode(mode) {
  return mode === serve;
}
function isBuildMode(mode) {
  return mode === build;
}

const RESET = "\x1B[0m";
const BRIGHT = "\x1B[1m";
const DIM = "\x1B[2m";
const FG_CYAN = "\x1B[36m";
function debugLog(...args) {
  const LOG_PREFIX = `${FG_CYAN}${BRIGHT}VITE PLUGIN GRAPHQL CODEGEN${RESET} `;
  console.log(LOG_PREFIX, DIM, ...args, RESET);
}

async function getDocumentPaths(context) {
  const config = context.getConfig();
  const sourceDocuments = Object.values(config.generates).map(
    (output) => Array.isArray(output) ? void 0 : output.documents
  );
  if (config.documents) {
    sourceDocuments.unshift(config.documents);
  }
  const normalized = sourceDocuments.filter((item) => !!item).flat();
  if (!normalized.length)
    return [];
  const documents = await context.loadDocuments(normalized);
  if (!documents.length)
    return [];
  return documents.map(({ location = "" }) => location).filter(Boolean).map(normalizePath);
}
async function getSchemaPaths(context) {
  const config = context.getConfig();
  const sourceSchemas = Object.values(config.generates).map(
    (output) => Array.isArray(output) ? void 0 : output.schema
  );
  if (config.schema) {
    sourceSchemas.unshift(config.schema);
  }
  const schemas = sourceSchemas.filter((item) => !!item).flat();
  if (!schemas.length)
    return [];
  return schemas.filter((schema) => typeof schema === "string").filter(Boolean).map((schema) => resolve(schema)).map(normalizePath);
}

function GraphQLCodegen(options) {
  let codegenContext;
  let viteMode;
  const {
    runOnStart = true,
    runOnBuild = true,
    enableWatcher = true,
    throwOnStart = false,
    throwOnBuild = true,
    matchOnDocuments = true,
    matchOnSchemas = false,
    config = null,
    configOverride = {},
    configOverrideOnStart = {},
    configOverrideOnBuild = {},
    configOverrideWatcher = {},
    configFilePathOverride,
    debug = false
  } = options ?? {};
  const log = (...args) => {
    if (!debug)
      return;
    debugLog(...args);
  };
  const generateWithOverride = async (overrideConfig) => {
    const currentConfig = codegenContext.getConfig();
    return generate({
      ...currentConfig,
      ...configOverride,
      ...overrideConfig,
      // Vite handles file watching
      watch: false
    });
  };
  if (options)
    log("Plugin initialized with options:", options);
  return {
    name: "graphql-codegen",
    async config(_config, env) {
      try {
        if (config) {
          log("Manual config passed, creating codegen context");
          codegenContext = new CodegenContext({ config });
        } else {
          const cwd = process.cwd();
          log("Loading codegen context:", configFilePathOverride ?? cwd);
          codegenContext = await loadContext(configFilePathOverride);
        }
        log("Loading codegen context successful");
      } catch (error) {
        log("Loading codegen context failed");
        throw error;
      }
      if (!matchOnDocuments) {
        log(`File watcher for documents is disabled by config`);
      }
      if (!matchOnSchemas) {
        log(`File watcher for schemas is disabled by config`);
      }
      viteMode = env.command;
    },
    async buildStart() {
      if (isServeMode(viteMode)) {
        if (!runOnStart)
          return;
        try {
          await generateWithOverride(configOverrideOnStart);
          log("Generation successful on start");
        } catch (error) {
          log("Generation failed on start");
          if (throwOnStart)
            throw error;
        }
      }
      if (isBuildMode(viteMode)) {
        if (!runOnBuild)
          return;
        try {
          await generateWithOverride(configOverrideOnBuild);
          log("Generation successful on build");
        } catch (error) {
          log("Generation failed on build");
          if (throwOnBuild)
            throw error;
        }
      }
    },
    async configureServer(server) {
      if (!enableWatcher)
        return;
      const documentPaths = await getDocumentPaths(codegenContext);
      const schemaPaths = await getSchemaPaths(codegenContext);
      const isMatch = (filePath) => {
        let matched = false;
        if (matchOnDocuments) {
          if (isFileMatched(filePath, documentPaths)) {
            matched = true;
            log(`Graphql document file matched: ${filePath}`);
          }
        }
        if (matchOnSchemas) {
          if (isFileMatched(filePath, schemaPaths)) {
            matched = true;
            log(`Graphql schema file matched: ${filePath}`);
          }
        }
        return matched;
      };
      const listener = async (filePath = "") => {
        const isConfig = isCodegenConfig(filePath, codegenContext.filepath);
        if (isConfig) {
          log("Codegen config file changed, restarting vite");
          await server.restart();
          return;
        }
        if (!isMatch(filePath))
          return;
        try {
          await generateWithOverride(configOverrideWatcher);
          log("Generation successful in file watcher");
        } catch (error) {
          log("Generation failed in file watcher");
        }
      };
      server.watcher.on("add", listener);
      server.watcher.on("change", listener);
    }
  };
}

export { GraphQLCodegen, GraphQLCodegen as default };

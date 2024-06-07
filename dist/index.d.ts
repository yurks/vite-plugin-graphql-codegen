import { Plugin } from 'vite';
import { CodegenConfig } from '@graphql-codegen/cli';

interface Options {
    /**
     * Run codegen on server start.
     *
     * @defaultValue `true`
     */
    runOnStart?: boolean;
    /**
     * Run codegen on build. Will prevent build if codegen fails.
     *
     * @defaultValue `true`
     */
    runOnBuild?: boolean;
    /**
     * Enable codegen integration with vite file watcher.
     *
     * @defaultValue `true`
     */
    enableWatcher?: boolean;
    /**
     * Throw an error if codegen fails on server start.
     *
     * @defaultValue `false`
     */
    throwOnStart?: boolean;
    /**
     * Throw an error if codegen fails on build.
     *
     * @defaultValue `true`
     */
    throwOnBuild?: boolean;
    /**
     * Run codegen when a document matches.
     *
     * @defaultValue `true`
     */
    matchOnDocuments?: boolean;
    /**
     * Run codegen when a schema matches. Only supports file path based schemas.
     *
     * @defaultValue `false`
     */
    matchOnSchemas?: boolean;
    /**
     * Manually define the codegen config.
     */
    config?: CodegenConfig;
    /**
     * Override parts of the codegen config just for this plugin.
     */
    configOverride?: Partial<CodegenConfig>;
    /**
     * Override parts of the codegen config just for this plugin on server start.
     */
    configOverrideOnStart?: Partial<CodegenConfig>;
    /**
     * Override parts of the codegen config just for this plugin on build.
     */
    configOverrideOnBuild?: Partial<CodegenConfig>;
    /**
     * Override parts of the codegen config just for this plugin in the watcher.
     */
    configOverrideWatcher?: Partial<CodegenConfig>;
    /**
     * Override the codegen config file path.
     */
    configFilePathOverride?: string;
    /**
     * Log various steps to aid in tracking down bugs.
     *
     * @defaultValue `false`
     */
    debug?: boolean;
}
declare function GraphQLCodegen(options?: Options): Plugin;

export { GraphQLCodegen, type Options, GraphQLCodegen as default };

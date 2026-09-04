import type { PluginContext, PluginCleanup } from "@getpaseo/plugin";
import { createPluginLogger, type PluginLogger, type PluginLoggerOptions } from "./logger.js";

export interface PluginServerContext {
  /**
   * Structured logger pre-configured with the plugin's name and version.
   */
  log: PluginLogger;
}

export interface DefinePluginServerOptions {
  /**
   * Identifier / name of the plugin (e.g. "top", "mcp-monitor", "x-comms").
   */
  name: string;

  /**
   * Optional version of the plugin (e.g. "0.1.0"). Displayed in startup banner and logs.
   */
  version?: string;

  /**
   * Logging configuration.
   * - Set to `false` to disable automatic banner and use a silent logger.
   * - Pass `PluginLoggerOptions` to customize log levels or metadata.
   * - Defaults to `{ banner: true }`.
   */
  logging?: boolean | Partial<PluginLoggerOptions>;

  /**
   * Plugin setup function executed when Paseo loads the plugin into the daemon.
   * Receives Paseo's `PluginContext` and a `PluginServerContext` with pre-configured `log`.
   * Must return a cleanup function.
   */
  setup: (
    plugin: PluginContext,
    context: PluginServerContext,
  ) => PluginCleanup | void | Promise<PluginCleanup | void>;
}

/**
 * Declares a Paseo daemon plugin entrypoint with automatic version banners,
 * structured single-line logging, and secret redaction out of the box.
 *
 * @example
 * ```ts
 * export default definePluginServer({
 *   name: "top",
 *   version: "0.1.0",
 *   setup(plugin, { log }) {
 *     plugin.handle(getMetricsRpc, handleGetMetrics);
 *     log.info("Registered RPC handlers");
 *     return () => {};
 *   },
 * });
 * ```
 */
export function definePluginServer(
  options: DefinePluginServerOptions,
): (plugin: PluginContext) => PluginCleanup {
  return (plugin: PluginContext): PluginCleanup => {
    let logger: PluginLogger;

    if (options.logging === false) {
      logger = createPluginLogger(options.name, {
        version: options.version,
        banner: false,
        minLevel: "error", // Suppress normal logs
      });
    } else {
      const loggerOpts: PluginLoggerOptions = {
        version: options.version,
        banner: true,
        ...(typeof options.logging === "object" ? options.logging : {}),
      };
      logger = createPluginLogger(options.name, loggerOpts);
    }

    const cleanupPromise = options.setup(plugin, { log: logger });

    return () => {
      if (typeof cleanupPromise === "function") {
        return cleanupPromise();
      }
      if (cleanupPromise && typeof (cleanupPromise as Promise<any>).then === "function") {
        return (cleanupPromise as Promise<any>).then((cleanup) => {
          if (typeof cleanup === "function") {
            return cleanup();
          }
        });
      }
    };
  };
}

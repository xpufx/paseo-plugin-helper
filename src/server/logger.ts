import { redactSecrets } from "./redact.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface PluginLoggerOptions {
  /**
   * Version of the plugin (e.g. "0.1.0" or imported from package.json).
   */
  version?: string;

  /**
   * Whether to emit a formatted startup banner on initialization.
   * Defaults to `true`.
   */
  banner?: boolean;

  /**
   * Subsystem or module tag within the plugin (e.g. "poller", "mcp-client").
   */
  subsystem?: string;

  /**
   * Minimum log level to print. Defaults to "info" ("debug" logs will be suppressed).
   */
  minLevel?: LogLevel;

  /**
   * Optional custom metadata key-values to include in the startup banner.
   */
  meta?: Record<string, string | number | boolean>;
}

export interface PluginLogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  child(subsystemOrOptions: string | Partial<PluginLoggerOptions>): PluginLogger;
}

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function formatData(data: unknown): string {
  if (data === undefined) return "";
  if (data instanceof Error) {
    return `error="${data.message}"${data.stack ? `\n${data.stack}` : ""}`;
  }

  const sanitized = redactSecrets(data);
  if (typeof sanitized === "object" && sanitized !== null && !Array.isArray(sanitized)) {
    const pairs = Object.entries(sanitized as Record<string, unknown>).map(
      ([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
    );
    return pairs.join(" ");
  }

  return typeof sanitized === "string" ? sanitized : JSON.stringify(sanitized);
}

/**
 * Creates a structured logger for Paseo plugins.
 * By default, displays the plugin name and version in startup logs and tags each line
 * for Paseo's log stream without fragmented multi-line JSON.
 */
export function createPluginLogger(
  pluginId: string,
  options: PluginLoggerOptions = {},
): PluginLogger {
  const {
    version,
    banner = true,
    subsystem,
    minLevel = "info",
    meta = {},
  } = options;

  const minSeverity = LEVEL_SEVERITY[minLevel];

  // Prefix format: "[name vX.Y.Z]" or "[name]" or "[name vX.Y.Z:subsystem]"
  const versionTag = version ? ` v${version}` : "";
  const subTag = subsystem ? `:${subsystem}` : "";
  const baseTag = `[${pluginId}${versionTag}${subTag}]`;

  if (banner) {
    const bannerDetails = [
      `pid ${process.pid}`,
      `node ${process.version}`,
      ...Object.entries(meta).map(([k, v]) => `${k} ${v}`),
    ].join(", ");

    // Emit startup banner directly to stdout
    console.log(`${baseTag} Initializing plugin (${bannerDetails})`);
  }

  function emit(level: LogLevel, message: string, data?: unknown) {
    if (LEVEL_SEVERITY[level] < minSeverity) return;

    const levelTag = `[${level.toUpperCase()}]`;
    const formattedData = formatData(data);
    const line = formattedData
      ? `${baseTag} ${levelTag} ${message} ${formattedData}`
      : `${baseTag} ${levelTag} ${message}`;

    if (level === "error" || level === "warn") {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  return {
    debug(message: string, data?: unknown) {
      emit("debug", message, data);
    },
    info(message: string, data?: unknown) {
      emit("info", message, data);
    },
    warn(message: string, data?: unknown) {
      emit("warn", message, data);
    },
    error(message: string, data?: unknown) {
      emit("error", message, data);
    },
    child(subsystemOrOptions: string | Partial<PluginLoggerOptions>): PluginLogger {
      const childOptions: PluginLoggerOptions =
        typeof subsystemOrOptions === "string"
          ? { ...options, banner: false, subsystem: subsystemOrOptions }
          : { ...options, banner: false, ...subsystemOrOptions };

      return createPluginLogger(pluginId, childOptions);
    },
  };
}

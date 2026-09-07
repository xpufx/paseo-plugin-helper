import type { AuditRule } from "./types.js";

export const AUDIT_RULES: Record<string, AuditRule> = {
  "no-manual-agent-subscription": {
    id: "no-manual-agent-subscription",
    severity: "warn",
    description: "Manual Paseo agent subscription and composer pill registration detected.",
    replacement: "registerComposerPill from 'paseo-plugin-helper/client'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/client.md#3-lifecycle-registration-helpers",
  },
  "no-raw-file-persistence": {
    id: "no-raw-file-persistence",
    severity: "warn",
    description: "Direct file write (fs.writeFileSync / fs.writeFile) used for state, status, or configuration persistence.",
    replacement: "PluginStorage from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#3-atomic-state-storage-pluginstorage",
  },
  "no-raw-console-in-server": {
    id: "no-raw-console-in-server",
    severity: "suggestion",
    description: "Raw console logging (console.log / console.error) used in server runtime.",
    replacement: "createPluginLogger from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#1-structured-logging-createpluginlogger",
  },
  "no-filesystem-plugin-probing": {
    id: "no-filesystem-plugin-probing",
    severity: "warn",
    description: "Direct filesystem inspection of ~/.paseo/plugins or config.json to check plugin presence.",
    replacement: "isPluginRunning, isPluginInstalled, or listPlugins from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#12-plugin-query--lifecycle-helpers-listplugins-ispluginrunning-getplugininfo",
  },
  "no-manual-mcp-config-mutation": {
    id: "no-manual-mcp-config-mutation",
    severity: "warn",
    description: "Manual modification or parsing of agent MCP configuration files (Claude, Cursor, Gemini, OpenCode).",
    replacement: "upsertMcpServer / removeMcpServer from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#11-agent-mcp-configuration-writer-upsertmcpserver--removemcpserver",
  },
  "no-raw-mcp-subprocess": {
    id: "no-raw-mcp-subprocess",
    severity: "warn",
    description: "Raw child_process spawn used to launch or communicate with MCP stdio servers.",
    replacement: "McpClient from 'paseo-plugin-helper/mcp'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/mcp.md",
  },
  "no-raw-system-metrics": {
    id: "no-raw-system-metrics",
    severity: "suggestion",
    description: "Direct os module calls (os.loadavg, os.cpus) or /proc reads for host metrics.",
    replacement: "getSystemMetrics / CpuSampler from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#2-system-host-metrics-getsystemmetrics--cpusampler",
  },
  "no-unredacted-secrets": {
    id: "no-unredacted-secrets",
    severity: "warn",
    description: "Sensitive tokens, API keys, or credentials handled or logged without redaction.",
    replacement: "redactSecrets from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#5-secret-redaction-redactsecrets",
  },
  "no-manual-version-resolution": {
    id: "no-manual-version-resolution",
    severity: "suggestion",
    description: "Manual reading and parsing of package.json for plugin version resolution.",
    replacement: "resolvePluginVersion / stampVersion from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#6-plugin-version-resolution-resolvepluginversion",
  },
};

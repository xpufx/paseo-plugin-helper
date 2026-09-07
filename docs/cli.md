# CLI & Audit Tool (`paseo-plugin-helper audit` / `doctor`)

The `paseo-plugin-helper` CLI provides a deterministic scanner for analyzing Paseo plugins. It inspects plugin source code to identify raw, bespoke patterns that should be migrated to helper functions.

`doctor` is an alias for `audit`.

---

## Quickstart

Run directly using `npx`:

```bash
# Audit the current directory (using audit or doctor)
npx paseo-plugin-helper audit .
npx paseo-plugin-helper doctor .

# Or using the paseo-doctor alias
npx paseo-doctor .

# Audit a specific plugin path
npx paseo-plugin-helper doctor ~/code/my-plugin

# Enforce in CI or automated agent task (exits with code 1 if issues found)
npx paseo-plugin-helper doctor . --strict

# Machine-readable JSON output for agent orchestration
npx paseo-plugin-helper doctor . --format json
```

---

## CLI Options

| Flag | Type | Description |
| :--- | :--- | :--- |
| `[path]` | `string` | Target directory to audit (defaults to `.`) |
| `--strict` | `boolean` | Exit with code 1 if any warnings or suggestions are detected |
| `--format` | `pretty \| json` | Output human-readable terminal text or JSON |
| `--ignore` | `string` | Comma-separated list of additional directories to skip |
| `-h, --help` | `boolean` | Show help message |

---

## Audit Rules Catalog

| Rule ID | Severity | Detected Pattern | Recommended Helper |
| :--- | :--- | :--- | :--- |
| `no-manual-agent-subscription` | `warn` | Manual `client.paseo.agents.subscribe` and `client.addComposerPill` | `registerComposerPill` from `paseo-plugin-helper/client` |
| `no-raw-file-persistence` | `warn` | `fs.writeFileSync` / `fs.writeFile` for state or settings persistence | `PluginStorage` from `paseo-plugin-helper/server` |
| `no-raw-console-in-server` | `suggestion` | Unformatted `console.log` / `console.error` in daemon code | `createPluginLogger` from `paseo-plugin-helper/server` |
| `no-filesystem-plugin-probing` | `warn` | Checking `~/.paseo/plugins` or `config.json` via filesystem | `isPluginRunning`, `isPluginInstalled`, or `listPlugins` from `paseo-plugin-helper/server` |
| `no-manual-mcp-config-mutation` | `warn` | Modifying `.claude.json`, `opencode.json`, `mcp.json` manually | `upsertMcpServer` and `removeMcpServer` from `paseo-plugin-helper/server` |
| `no-raw-mcp-subprocess` | `warn` | Spawning raw child processes for MCP stdio / JSON-RPC | `McpClient` from `paseo-plugin-helper/mcp` |
| `no-raw-system-metrics` | `suggestion` | Direct `os.loadavg()`, `os.cpus()`, or `/proc/loadavg` reads | `getSystemMetrics` / `CpuSampler` from `paseo-plugin-helper/server` |
| `no-manual-version-resolution` | `suggestion` | Reading `package.json` manually to parse plugin version | `resolvePluginVersion` or `stampVersion` from `paseo-plugin-helper/server` |

---

## Programmatic Usage

You can also run the audit engine programmatically inside your tests or agent scripts:

```ts
import { auditProject, formatReportPretty } from "paseo-plugin-helper/cli";

const report = auditProject("./my-plugin", { strict: true });

if (!report.passed) {
  console.error(formatReportPretty(report));
  process.exit(1);
}
```

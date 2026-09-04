# Server Module (`paseo-plugin-helper/server`)

The `server` module provides runtime utilities for daemon-side plugin logic. It handles structured logging with auto-banners, system resource metrics, atomic state storage, shell-free process spawning, JSONC parsing, and sensitive credential masking.

---

## 1. Structured Logging: `createPluginLogger`

Creates a structured logger tailored for Paseo plugins.

By default, it automatically emits a **startup banner** containing the plugin's name, version, PID, and runtime info so the plugin log viewer in the Paseo GUI displays identity rather than just `[paseo] Plugin ready`.

### Usage
```ts
import { createPluginLogger } from "paseo-plugin-helper/server";

// Default: displays startup banner on initialization
export const log = createPluginLogger("top", {
  version: "0.1.0",
  // Optional: banner: false, minLevel: "debug", subsystem: "poller"
});

log.info("System poll completed", { cpu: "12.4%", ram: "3.2G" });
log.warn("Memory threshold reached", { used: "92%" });
log.error("Failed to read metrics", error);
```

### Output in Paseo GUI Log Viewer
```text
2026-09-04T13:43:19.590Z stdout
[paseo] Loading plugin

2026-09-04T13:43:19.620Z stdout
[top v0.1.0] Initializing plugin (pid 4016181, node v22.14.0)

2026-09-04T13:43:19.874Z stdout
[paseo] Plugin ready

2026-09-04T13:43:22.100Z stdout
[top v0.1.0] [INFO] System poll completed cpu=12.4% ram=3.2G

2026-09-04T13:43:24.400Z stderr
[top v0.1.0] [WARN] Memory threshold reached used=92%
```

### Features
- **Auto-Banner**: Emits name, version, and process metadata on startup (can be disabled via `{ banner: false }`).
- **Single-Line Formatting**: Key-values format as concise `key=val` pairs so lines don't get fragmented in the GUI.
- **Automatic Secret Scrubbing**: All objects and data are passed through `redactSecrets()` to prevent leaking credentials.
- **Child Loggers**: `const pollerLog = log.child("poller")` creates tagged logs: `[top v0.1.0:poller]`.
- **Stream Routing**: `info` and `debug` output to `stdout`; `warn` and `error` output to `stderr`.

---

## 2. System Host Metrics: `getSystemMetrics` & `CpuSampler`

Utilities for sampling instant CPU percentages, memory, and host details.

```ts
import { getSystemMetrics, CpuSampler } from "paseo-plugin-helper/server";

// Get complete snapshot
const metrics = getSystemMetrics();
console.log(metrics.hostname, metrics.cpu.usagePercent, metrics.memory.usedPercent);

// Or track CPU usage with custom sampling interval:
const sampler = new CpuSampler();
const sample = sampler.sample(); // { usagePercent: 12.5, perCore: [10, 15, 8, 17] }
```

---

## 3. Atomic Storage: `PluginStorage<T>`

`PluginStorage` provides atomic persistence for plugin settings, cache, and state.

Writes are performed by writing to a temporary file (`.tmp`) and executing an atomic filesystem rename, ensuring files are never corrupted by unexpected crashes or system power loss.

```ts
import { PluginStorage } from "paseo-plugin-helper/server";

interface Config {
  apiKey: string;
  refreshInterval: number;
}

const storage = new PluginStorage<Config>("my-plugin", "config.json", {
  defaultData: { apiKey: "", refreshInterval: 60 },
});

const config = storage.read();
storage.write({ ...config, refreshInterval: 120 });
```

---

## 4. Safe Process Execution: `safeSpawn`

Executes commands directly without invoking a system shell, eliminating shell injection vulnerabilities. Supports buffer limits and timeout escalation (SIGTERM followed by SIGKILL).

```ts
import { safeSpawn } from "paseo-plugin-helper/server";

const result = await safeSpawn("git", ["status", "--porcelain"], {
  cwd: "/path/to/repo",
  timeoutMs: 5000,
});
```

---

## 5. Secret Redaction: `redactSecrets`

Deeply traverses objects, arrays, and strings to redact credentials before writing to logs or sending data over RPC channels.

- Automatically redacts sensitive object keys (`token`, `apiKey`, `password`, `secret`, `authorization`, etc.).
- Keeps first 3 and last 3 characters for long tokens (`sk-...345`).

---

## 6. JSONC Parser: `parseJsonc` & `stripJsonComments`

Resilient parser that removes single-line (`//`) and multi-line (`/* */`) comments and trailing commas from JSON.

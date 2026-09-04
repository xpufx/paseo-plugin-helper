# Server Module (`paseo-plugin-helper/server`)

The `server` module provides runtime utilities for daemon-side plugin logic. It handles atomic state storage, shell-free process spawning, JSONC parsing, and sensitive credential masking.

---

## 1. Atomic Storage: `PluginStorage<T>`

`PluginStorage` provides atomic persistence for plugin settings, cache, and state.

Writes are performed by writing to a temporary file (`.tmp`) and executing an atomic filesystem rename, ensuring files are never corrupted by unexpected crashes or system power loss.

### Constructor
```ts
import { PluginStorage } from "paseo-plugin-helper/server";

interface Config {
  apiKey: string;
  refreshInterval: number;
}

const storage = new PluginStorage<Config>("my-plugin", "config.json", {
  defaultData: { apiKey: "", refreshInterval: 60 },
  baseDir: "/custom/path", // Optional, defaults to ~/.paseo/plugins/my-plugin/config.json
});
```

### Methods
- `storage.read(): T`: Synchronously reads and parses stored data. Returns `defaultData` if missing or corrupted.
- `storage.readAsync(): Promise<T>`: Asynchronous read.
- `storage.write(data: T): void`: Synchronous atomic write.
- `storage.writeAsync(data: T): Promise<void>`: Asynchronous atomic write.
- `storage.update(updater: (prev: T) => T): T`: Reads, applies updater function, and atomically saves the result.
- `storage.updateAsync(updater: (prev: T) => Promise<T> | T): Promise<T>`: Async update.
- `storage.exists(): boolean`: Checks if backing file exists.
- `storage.reset(): void`: Deletes stored file from disk.

---

## 2. Safe Process Execution: `safeSpawn`

Executes commands directly without invoking a system shell, eliminating shell injection vulnerabilities. Supports buffer limits and timeout escalation (SIGTERM followed by SIGKILL).

```ts
import { safeSpawn } from "paseo-plugin-helper/server";

try {
  const result = await safeSpawn("git", ["status", "--porcelain"], {
    cwd: "/path/to/repo",
    timeoutMs: 5000,     // Default: 15,000ms
    maxBuffer: 1024 * 1024, // Default: 10MB
  });

  console.log("Stdout:", result.stdout);
  console.log("Exit Code:", result.code);
  console.log("Duration:", result.durationMs, "ms");
} catch (err) {
  console.error("Execution failed or timed out:", err.message);
}
```

---

## 3. Secret Redaction: `redactSecrets`

Deeply traverses objects, arrays, and strings to redact credentials before writing to logs or sending data over RPC channels.

- Automatically redacts sensitive object keys (`token`, `apiKey`, `password`, `secret`, `authorization`, `privateKey`, etc.).
- Keeps first 3 and last 3 characters for long tokens (`sec...678`) to allow identification without exposure.
- Redacts `Bearer <token>` in authorization headers.
- Redacts user/password credentials in URLs (`https://user:[REDACTED]@host/path`).

```ts
import { redactSecrets } from "paseo-plugin-helper/server";

const config = {
  server: "https://api.example.com",
  apiKey: "sk-proj-1234567890abcdef",
  nested: {
    dbPassword: "SuperSecretPassword!",
  },
};

const sanitized = redactSecrets(config);
// {
//   server: "https://api.example.com",
//   apiKey: "sk-...def",
//   nested: {
//     dbPassword: "Sup...rd!"
//   }
// }
```

---

## 4. JSONC Parser: `parseJsonc` & `stripJsonComments`

A resilient JSON parser that removes single-line (`//`) and multi-line (`/* */`) comments as well as trailing commas from JSON strings.

Safe against URLs (`https://...`) and regexes containing slash characters.

```ts
import { parseJsonc, stripJsonComments } from "paseo-plugin-helper/server";

const jsoncString = `
{
  // User preferences
  "theme": "dark",
  "notifications": true, /* enabled */
}
`;

const data = parseJsonc<{ theme: string; notifications: boolean }>(jsoncString);
```

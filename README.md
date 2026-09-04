# paseo-plugin-helper

> Developer toolkit, UI design system, and lifecycle primitives for building high-quality Paseo desktop & mobile plugins.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

`paseo-plugin-helper` provides drop-in solutions for building 3rd-party plugins for [Paseo](https://github.com/getpaseo/paseo). It eliminates boilerplate and provides native-feeling React Native UI components with **mobile-first responsiveness**, **configurable visual flairs**, **zero-dependency MCP client diagnostics**, and **daemon runtime utilities**.

> [!NOTE]
> **Compatibility**: This library currently targets **Paseo v0.7** plugin architecture (`@getpaseo/plugin@^0.7.2`). Paseo v0.8 introduces breaking changes to plugin surfaces and lifecycle APIs; a major version update (`v0.8.0`) of `paseo-plugin-helper` will follow once Paseo v0.8 is officially released.

---

## Features

- 📝 **Structured Logging & Identity**: `createPluginLogger` automatically prints an informative startup banner with plugin identity/version in Paseo GUI logs and keeps log lines unfragmented.
- 🏷️ **Version Resolution & Stamping**: Auto-extracts plugin version from `package.json` + Git tags (`resolvePluginVersion`) and generates static TypeScript versions for Hermes client bundles (`stampVersion`).
- 📱 **Mobile & Desktop First**: Automatically scales touch targets (min 44pt on iOS/Android or narrow panes), avoids bottom-bar clipping, and reflows layouts between desktop and mobile.
- 🎨 **Configurable Visual Flair**: Authors can customize corner radii (`sharp`, `rounded`, `pill`), information density, surface treatments, and brand accents while honoring Paseo's light/dark themes.
- 💊 **Composer Pill Lifecycle Engine**: Complete management of agent subscriptions, pill contributions, and modal states in one function call (`registerComposerPill`).
- 🖥️ **Panels & Surfaces**: One-line registration for sidebar surfaces (`registerSidebarSurface`) and panels (`registerWorkspacePanel`, `registerAgentPanel`) with automatic theme and flair propagation.
- 🔌 **Zero-Dependency MCP Client**: Built-in stdio client (`McpClient`) with stderr ring buffering, non-JSON stdout line filtering, cross-platform process tree cleanup, and fallback ping readiness checks.
- ⚡ **React Query RPC Bridge**: `useRpcQuery` & `useRpcMutation` with automatic caching, refetching, and input hashing.
- 💾 **Daemon State & File Storage**: Atomic, temporary-swap file storage (`PluginStorage`) preventing corruption during power cuts or crashes.
- 🔒 **Security & Redaction**: Deep secret masking for Bearer tokens, API keys, and connection credentials (`redactSecrets`).
- 🧪 **Mock Testing Harness**: In-memory mocks for `PluginClientContext` and `PluginContext` for testing plugins in Vitest / Jest.

---

## Subpath Imports

To guarantee compliance with Paseo's bundler and compiler rules (no Node builtins in client bundles), import through explicit subpaths:

| Subpath | Target Platform | Description | Docs |
| :--- | :--- | :--- | :--- |
| `paseo-plugin-helper/client` | React Native / Hermes | UI components, visual flair provider, pill engine, panels, React Query hooks | [docs/client.md](docs/client.md) |
| `paseo-plugin-helper/server` | Node.js 20+ | `createPluginLogger`, `resolvePluginVersion`, `stampVersion`, `getSystemMetrics`, `PluginStorage`, `safeSpawn`, `redactSecrets` | [docs/server.md](docs/server.md) |
| `paseo-plugin-helper/mcp` | Node.js 20+ | Zero-dependency stdio `McpClient`, ring buffer, process tree killer | [docs/mcp.md](docs/mcp.md) |
| `paseo-plugin-helper/shared` | Universal | `defineContract`, formatters (`formatBytes`, `formatUptime`, `resolveMetricStatus`) | [docs/shared.md](docs/shared.md) |
| `paseo-plugin-helper/testing` | Universal | Mock client and server contexts for unit and integration testing | [docs/testing.md](docs/testing.md) |

---

## Installation

Install directly from GitHub:

```bash
# npm
npm install github:xpufx/paseo-plugin-helper

# pnpm
pnpm add github:xpufx/paseo-plugin-helper
```

Or in your plugin's `package.json`:
```json
{
  "dependencies": {
    "paseo-plugin-helper": "github:xpufx/paseo-plugin-helper"
  }
}
```

> [!TIP]
> The repository includes an automated `prepare` build lifecycle script. When npm/pnpm installs from GitHub, it automatically compiles the dual ESM/CJS bundles and TypeScript declaration maps on-the-fly.

---

## Quickstart

### 1. Client: Composer Pill & UI Primitives

```tsx
import type { PluginClientContribution } from "@getpaseo/plugin";
import {
  registerComposerPill,
  ModalBody,
  Card,
  Button,
  Badge,
  KeyValue,
  TextInput,
  Toggle,
  Collapsible,
  useRpcQuery,
} from "paseo-plugin-helper/client";
import { myStatusContract } from "./contracts.js";

export const contributeClient: PluginClientContribution = (client) => {
  return registerComposerPill(client, {
    id: "my-plugin",
    title: "System Stats",
    icon: "Activity",
    flair: {
      radius: "rounded",          // "sharp" | "rounded" | "pill"
      density: "comfortable",     // "compact" | "comfortable" | "spacious"
      accentColor: "#10b981",     // Custom brand emerald accent
    },
    renderModal({ agentId, close }) {
      const { data, isLoading } = useRpcQuery(myStatusContract, { agentId });

      return (
        <ModalBody>
          <Card>
            <KeyValue label="Status" value={data?.status} />
            <KeyValue label="Uptime" value={data?.uptime} />
            <Badge variant="success" label="Healthy" />
          </Card>
          <Button variant="secondary" label="Dismiss" onPress={close} />
        </ModalBody>
      );
    },
  });
};
```

---

### 2. Zero-Dependency MCP Diagnostics

```ts
import { McpClient } from "paseo-plugin-helper/mcp";

// Connect to any local or bundled MCP server over stdio
const client = McpClient.forStdio("node", ["./dist/mcp-server.js"]);

const ping = await client.ping({ mode: "tools" });
if (ping.healthy) {
  const tools = await client.listTools();
  console.log(`MCP server online. Latency: ${ping.latencyMs}ms. Tools:`, tools);
} else {
  console.error(`MCP server offline: ${ping.error}\nRecent stderr:\n${ping.stderr}`);
}

await client.close();
```

---

### 3. Server: Atomic Storage & Safe Process Execution

```ts
import type { PluginContribution } from "@getpaseo/plugin";
import { createPluginLogger, PluginStorage, safeSpawn } from "paseo-plugin-helper/server";
import { myStatusContract } from "./contracts.js";

// Emits startup banner: "[my-plugin v0.1.0] Initializing plugin..."
const log = createPluginLogger("my-plugin", { version: "0.1.0" });

interface PluginState {
  lastRun: string;
  runCount: number;
}

const storage = new PluginStorage<PluginState>("my-plugin", "state.json", {
  defaultData: { lastRun: "", runCount: 0 },
});

export const contributePlugin: PluginContribution = (plugin) => {
  plugin.handle(myStatusContract, async (input) => {
    log.info("Processing status request", { target: input.target });
    const { stdout } = await safeSpawn("uptime", [], { timeoutMs: 3000 });

    storage.update((prev) => ({
      lastRun: new Date().toISOString(),
      runCount: prev.runCount + 1,
    }));

    return {
      uptime: stdout,
      status: "online",
    };
  });

  return () => {};
};
```

---

## Documentation

Comprehensive API and module documentation:

- 📖 [Client Design System & Lifecycles (`docs/client.md`)](docs/client.md)
- 📖 [Server Daemon Utilities (`docs/server.md`)](docs/server.md)
- 📖 [MCP Client & Transports (`docs/mcp.md`)](docs/mcp.md)
- 📖 [Shared Types & Formatters (`docs/shared.md`)](docs/shared.md)
- 📖 [Testing Harness (`docs/testing.md`)](docs/testing.md)

---

## Known Users of the Library

Plugins powered by `paseo-plugin-helper`:

- 📊 [**`paseo-top`**](https://github.com/xpufx/paseo-top) – Real-time system resource monitor (CPU, memory, load average) for Paseo composers with responsive charts, cards, and warning thresholds.

---

## License

MIT © [xpufx](LICENSE)

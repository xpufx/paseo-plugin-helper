# paseo-plugin-helper

> Developer toolkit, UI design system, and shared lifecycle primitives for building high-quality Paseo desktop & mobile plugins.

`paseo-plugin-helper` provides drop-in solutions for building 3rd-party plugins for [Paseo](https://github.com/getpaseo/paseo). It eliminates boilerplate and provides native-feeling React Native UI components with **mobile-first responsiveness**, **configurable visual flairs**, and **daemon runtime utilities**.

---

## Features

- 📱 **Mobile & Desktop First**: Automatically scales touch targets (min 44pt on iOS/Android or narrow panes), avoids bottom-bar clipping, and reflows layouts between desktop and mobile.
- 🎨 **Configurable Visual Flair**: Authors can customize corner radii (`sharp`, `rounded`, `pill`), information density, surface treatments, and brand accents while honoring Paseo's light/dark themes.
- 💊 **Composer Pill Lifecycle Engine**: Complete management of agent subscriptions, pill contributes, and modal states in one function call (`registerComposerPill`).
- ⚡ **React Query RPC Bridge**: `useRpcQuery` & `useRpcMutation` with automatic caching, refetching, and input hashing.
- 💾 **Daemon State & File Storage**: Atomic, temporary-swap file storage (`PluginStorage`) preventing corruption during power cuts or crashes.
- 🔒 **Security & Redaction**: Deep secret masking for Bearer tokens, API keys, and connection credentials (`redactSecrets`).
- 🧪 **Mock Testing Harness**: In-memory mocks for `PluginClientContext` and `PluginContext` for testing plugins in Vitest / Jest.

---

## Subpath Imports

To guarantee compliance with Paseo's bundler and compiler rules (no Node builtins in client bundles), import through explicit subpaths:

| Subpath | Target Platform | Description |
| :--- | :--- | :--- |
| `paseo-plugin-helper/client` | React Native / Hermes | UI components, visual flair provider, pill engine, React Query hooks |
| `paseo-plugin-helper/server` | Node.js 20+ | Atomic `PluginStorage`, `safeSpawn`, `parseJsonc`, `redactSecrets` |
| `paseo-plugin-helper/shared` | Universal | `defineContract`, formatters (`formatBytes`, `formatUptime`, `truncate`) |
| `paseo-plugin-helper/testing` | Universal | Mock client and server contexts for unit and integration testing |

---

## Quickstart

### 1. Client: Composer Pill & UI Components

```tsx
import type { PluginClientContribution } from "@getpaseo/plugin";
import {
  registerComposerPill,
  ModalBody,
  Card,
  Button,
  Badge,
  KeyValue,
  useRpcQuery,
} from "paseo-plugin-helper/client";
import { myStatusContract } from "./contracts.js";

export const contributeClient: PluginClientContribution = (client) => {
  return registerComposerPill(client, {
    id: "my-plugin",
    title: "System Stats",
    icon: "Activity",
    // Optional flair customization:
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

### 2. Server: Atomic Storage & Safe Process Execution

```ts
import type { PluginContribution } from "@getpaseo/plugin";
import { PluginStorage, safeSpawn, redactSecrets } from "paseo-plugin-helper/server";
import { myStatusContract } from "./contracts.js";

interface PluginState {
  lastRun: string;
  runCount: number;
}

const storage = new PluginStorage<PluginState>("my-plugin", "state.json", {
  defaultData: { lastRun: "", runCount: 0 },
});

export const contributePlugin: PluginContribution = (plugin) => {
  plugin.handle(myStatusContract, async (input) => {
    // Safely run a command with timeout and buffer limits
    const { stdout } = await safeSpawn("uptime", [], { timeoutMs: 3000 });

    // Atomic update of state
    storage.update((prev) => ({
      lastRun: new Date().toISOString(),
      runCount: prev.runCount + 1,
    }));

    return {
      uptime: stdout,
      status: "online",
    };
  });
};
```

---

### 3. Shared: Type-Safe RPC Contracts

```ts
import { defineContract } from "paseo-plugin-helper/shared";
import { z } from "zod";

export const myStatusContract = defineContract({
  name: "my-plugin:get-status",
  description: "Fetches system uptime and status",
  input: z.object({
    agentId: z.string(),
  }),
  output: z.object({
    uptime: z.string(),
    status: z.string(),
  }),
});
```

---

### 4. Testing: Mock Test Harness

```ts
import { describe, it, expect } from "vitest";
import { createMockClientContext, createMockServerContext } from "paseo-plugin-helper/testing";
import { contributeClient } from "./client.js";

describe("My Plugin", () => {
  it("registers composer pills when agents arrive", async () => {
    const mockClient = createMockClientContext();
    const cleanup = contributeClient(mockClient);

    // Simulate an agent connecting in workspace
    mockClient.simulateAgentAdded({ id: "agent-123", workspaceId: "ws-abc" });

    expect(mockClient.registeredPills).toHaveLength(1);
    expect(mockClient.registeredPills[0].agentId).toBe("agent-123");

    cleanup();
  });
});
```

---

## Visual Flair Configuration

The `<PluginThemeProvider>` automatically handles contrast, WCAG compliance, and mobile touch sizing based on your flair preset:

| Property | Options | Description |
| :--- | :--- | :--- |
| `radius` | `"sharp"` \| `"rounded"` \| `"pill"` | 2px vs 8px vs full capsule |
| `density` | `"compact"` \| `"comfortable"` \| `"spacious"` | Tight padding for tools vs relaxed cards |
| `surfaceStyle` | `"flat"` \| `"tinted"` \| `"elevated"` | Clean outline vs tinted background wash |
| `accentColor` | Hex code (e.g. `"#6366f1"`) | Custom brand tint overriding host accent |
| `borderWidth` | `number` (default: `1`) | Border stroke width |
| `headingTransform` | `"none"` \| `"uppercase"` | Standard vs uppercase header tracking |

---

## License

MIT

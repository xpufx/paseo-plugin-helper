# Shared Module (`paseo-plugin-helper/shared`)

The `shared` module contains universal utilities, RPC contract builders, and formatting helpers. It has zero external dependencies (other than `zod`) and can be safely imported in both client and server contexts.

---

## 1. Type-Safe RPC: `defineContract`

Extends Paseo's `defineRpc` to allow attaching human-readable descriptions and extracts typed `RpcInput<T>` and `RpcOutput<T>` types.

```ts
import { defineContract, type RpcInput, type RpcOutput } from "paseo-plugin-helper/shared";
import { z } from "zod";

export const getMetricsContract = defineContract({
  name: "system:get-metrics",
  description: "Retrieves CPU and memory metrics",
  input: z.object({
    intervalSeconds: z.number().default(5),
  }),
  output: z.object({
    cpuUsage: z.number(),
    memoryUsedBytes: z.number(),
    memoryTotalBytes: z.number(),
  }),
});

// Infer types directly from the contract definition:
export type GetMetricsInput = RpcInput<typeof getMetricsContract>;
export type GetMetricsOutput = RpcOutput<typeof getMetricsContract>;
```

---

## 2. Text & Metric Formatters

### `formatBytes(bytes, optionsOrDecimals?)`
Converts byte counts into human-readable data units (`B`, `KB`, `MB`, `GB`, `TB`). Supports standard and compact notation (`"1.2K"`, `"5.3M"`, `"12.8G"`).
```ts
formatBytes(0);                       // "0 B"
formatBytes(1024);                    // "1.0 KB"
formatBytes(4718592, 2);              // "4.50 MB"
formatBytes(13421772800, { compact: true }); // "12.5G"
```

### `resolveMetricStatus(value, thresholds?)`
Calculates status variant (`"success" | "warning" | "danger"`) based on numeric thresholds. Supports inverted thresholds (`invert: true`) where higher values are safer.
```ts
// Standard gauge (default thresholds: warn at 75, danger at 90)
resolveMetricStatus(45); // "success"
resolveMetricStatus(82); // "warning"
resolveMetricStatus(95); // "danger"

// Inverted gauge (e.g. available battery/disk: lower is dangerous)
resolveMetricStatus(15, { warn: 30, danger: 20, invert: true }); // "danger"
```

### `formatUptime(seconds)`
Formats seconds into readable uptime format (`Xd Xh Xm Xs`).
```ts
formatUptime(45);           // "45s"
formatUptime(150);          // "2m"
formatUptime(3665);         // "1h 1m"
formatUptime(273600);       // "3d 4h"
```

### `formatDuration(ms)`
Formats elapsed millisecond intervals.
```ts
formatDuration(150);        // "150ms"
formatDuration(1500);       // "1.5s"
formatDuration(65000);      // "1m"
```

### `formatNumber(num)`
Formats integers and decimals with standard locale comma grouping.
```ts
formatNumber(12500);        // "12,500"
formatNumber(1000000);      // "1,000,000"
```

### `truncate(text, maxLength)`
Truncates long strings cleanly with an ellipsis (`…`).
```ts
truncate("Short", 10);      // "Short"
truncate("Very long string here", 8); // "Very lo…"
```

---

## 3. Shared Types

- `PlatformType`: `"web" | "ios" | "android" | "macos" | "windows" | "linux" | "unknown"`
- `ResponsiveLayout`: `{ compact: boolean; platform: PlatformType; width?: number; height?: number }`
- `StatusVariant`: `"success" | "warning" | "danger" | "neutral" | "accent" | "info"`
- `ThemeColors`: Complete color tokens resolved from Paseo's theme.

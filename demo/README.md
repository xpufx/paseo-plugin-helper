# helper-demo

A showcase plugin for [Paseo](https://github.com/getpaseo/paseo) exercising all client UI primitives and server daemon utilities provided by `paseo-plugin-helper`.

## Installing

In Paseo:

```bash
# Install directly from main:
paseo plugin add xpufx/paseo-plugin-helper:demo

# Or install locally:
paseo plugin add ./demo
```

## Features Exercised

- **Header Pill**: Dynamic Composer Pill with flair customization, status dot, and live CPU load.
- **Metric Gauges**: `<MetricGauge>` circular rings with automatic threshold status coloring.
- **Data Table**: `<DataTable>` with automatic mobile card reflow and `<SearchInput>` query filtering.
- **Live Auto-Refresh**: `useAutoRefreshQuery` with selectable interval rates and auto-pause.
- **Mobile Polish**: Pull-to-refresh on `<ModalBody>`, multi-line `<KeyValue>` text wrapping, and tactile haptic feedback (`triggerHaptic`).
- **Daemon Runtime**: `createPluginLogger`, `createPeriodicTask`, `getSystemMetrics`, and `findAvailablePort`.

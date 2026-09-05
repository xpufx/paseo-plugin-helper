# Client Module (`paseo-plugin-helper/client`)

The `client` module provides React Native UI primitives, layout containers, and lifecycle registration engines designed to integrate natively into Paseo's mobile and desktop environments.

It guarantees zero Node built-in imports, ensuring compliance with Hermes and Paseo's client plugin compiler.

---

## 1. Visual Flair & Theming

Paseo exposes theme tokens (`PluginTheme`) through host props. `PluginThemeProvider` wraps these tokens and applies custom visual styling rules while calculating WCAG contrast and mobile touch scaling.

### `VisualFlair` Interface
```ts
export interface VisualFlair {
  radius?: "sharp" | "rounded" | "pill";      // Default: "rounded"
  density?: "compact" | "comfortable" | "spacious"; // Default: "comfortable"
  surfaceStyle?: "flat" | "tinted" | "elevated";    // Default: "flat"
  accentColor?: string;                        // Custom brand hex (e.g. "#6366f1")
  borderWidth?: number;                        // Default: 1
  headingTransform?: "none" | "uppercase";     // Default: "none"
}
```

### `usePluginTheme()`
Hook providing resolved colors and utility functions inside any component wrapped by `PluginThemeProvider`:
```ts
const {
  theme,             // Raw Paseo PluginTheme
  colors,            // Resolved theme palette + status colors
  layout,            // ResponsiveLayout ({ compact: boolean, platform: "web" | "ios" | "android" | "macos" | "windows" | "linux" })
  isCompact,         // Boolean: true if mobile screen or narrow desktop split pane
  flair,             // Active VisualFlair configuration
  touchTargetMin,    // Minimum touch size in points (44pt on mobile/compact, 28pt on desktop)
  alpha,             // Helper: alpha(hexColor, opacityNumber) -> hex with alpha
  resolveRadius,     // Helper: resolveRadius("sm" | "md" | "lg" | "pill") -> number
  resolvePadding,    // Helper: resolvePadding("sm" | "md" | "lg") -> number
} = usePluginTheme();
```

---

## 2. Lifecycle Registration Helpers

### `registerComposerPill(client, options)`
Handles the complete lifecycle of injecting a composer pill for each active agent, subscribing to agent updates, opening modals, and unmounting cleanly.

```tsx
import { registerComposerPill, ModalBody, Button } from "paseo-plugin-helper/client";

export const contributeClient = (client) => {
  return registerComposerPill(client, {
    id: "top",
    title: "Top",                         // Pill button label
    modalTitle: "Host Resource Monitor",  // Descriptive modal header title (falls back to title)
    icon: "Activity",                     // Pill Lucide icon name
    modalIcon: "Cpu",                     // Modal header icon (name or ReactNode)
    flair: { radius: "rounded", accentColor: "#3b82f6" },
    // renderPill receives ({ isSelected, isCompact, isOpen, open, close, toggle })
    renderPill: ({ isOpen, toggle }) => (
      <Button label="CPU 14%" onPress={toggle} variant="ghost" />
    ),
    renderModal: ({ agentId, close }) => (
      <ModalBody>
        <Text>Agent ID: {agentId}</Text>
        <Button label="Close" onPress={close} />
      </ModalBody>
    ),
  });
};
```

### `registerSidebarSurface(plugin, options)`
Registers a sidebar icon and corresponding full-page surface in a single call, automatically injecting `<PluginThemeProvider>` with custom visual flair.

```tsx
import { registerSidebarSurface } from "paseo-plugin-helper/client";

registerSidebarSurface(plugin, {
  id: "my-surface",
  title: "Dashboard",
  icon: "LayoutDashboard",
  flair: { density: "comfortable" },
  Component: MyDashboardComponent,
});
```

### `registerWorkspacePanel(plugin, options)` & `registerAgentPanel(plugin, options)`
Registers panels with automatic `<PluginThemeProvider>` injection.

```tsx
import { registerWorkspacePanel, registerAgentPanel } from "paseo-plugin-helper/client";

registerWorkspacePanel(plugin, {
  id: "project-stats",
  title: "Project Stats",
  icon: "BarChart3",
  Component: ProjectStatsPanel,
});

registerAgentPanel(plugin, {
  id: "agent-memory",
  title: "Agent Memory",
  icon: "Brain",
  Component: AgentMemoryPanel,
});
```

---

## 3. UI Primitives

### `<Button>`
Responsive button supporting 4 visual variants, loading spinners, icons, and minimum 44pt touch scaling on mobile.

```tsx
<Button
  label="Deploy"
  variant="primary"       // "primary" | "secondary" | "danger" | "ghost"
  size="md"               // "sm" | "md" | "lg"
  icon="Rocket"
  loading={isDeploying}
  disabled={!canDeploy}
  onPress={handleDeploy}
/>
```

### `<TextInput>`
Form input with label, placeholder, helper or error text, secure text entry, and automatic focus ring highlighting.

```tsx
<TextInput
  label="API Host"
  placeholder="https://api.example.com"
  value={host}
  onChangeText={setHost}
  helperText="Include port if running locally"
  errorText={isValid ? undefined : "Invalid URL"}
/>
```

### `<Toggle>`
Accessible boolean switch with minimum 44pt touch boundary and custom visual flair theme support.

```tsx
<Toggle
  label="Enable Telemetry"
  description="Send anonymous crash reports to team"
  value={enabled}
  onValueChange={setEnabled}
/>
```

### `<Collapsible>`
Accordion container with chevron rotation, badges, and smooth expand/collapse.

```tsx
<Collapsible title="Schema Details" badge={<Badge label="JSON" />}>
  <CodeBlock code={schemaString} language="json" />
</Collapsible>
```

### `<Badge>`
Status indicator chip with automatic contrast styling.
```tsx
<Badge label="Online" variant="success" style="tinted" dot />
<Badge label="Warning" variant="warning" style="outline" />
<Badge label="Error" variant="danger" style="solid" />
```

### `<Card>`
Adaptive container styled according to the active `VisualFlair.surfaceStyle` (`flat`, `tinted`, or `elevated`). Includes a compound `<Card.Header>` for structured headers with titles, icons, and action chips.
```tsx
<Card variant="tinted" padding="md">
  <Card.Header
    title="Host Metrics"
    icon="Cpu"
    badge={<Badge label="Active" variant="success" size="sm" />}
  />
  <Text>Card Content</Text>
</Card>
```

### `<Tabs>`
Segmented horizontal tab selector designed for Paseo modal and surface environments. Features automatic fitting on mobile with `shortLabel` support, elevated edge navigation chevrons when scrolling, and `PanResponder` gesture capture to prevent mobile bottom sheets from swallowing horizontal swipes.

```tsx
<Tabs
  tabs={[
    { id: "overview", label: "System Overview", shortLabel: "Overview", icon: "Cpu" },
    { id: "storage", label: "Storage Volumes", shortLabel: "Storage", icon: "HardDrive" },
    { id: "network", label: "Network Diagnostics", shortLabel: "Net", icon: "Activity" },
    { id: "logs", label: "Realtime Logs", shortLabel: "Logs", icon: "Terminal", badge: 3 },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  mode="auto" // "auto" (fits on mobile or <= 4 tabs) | "fit" | "scroll"
/>
```

#### Properties:
- `tabs`: Array of `TabItem` objects (`id`, `label`, `shortLabel?`, `icon?`, `badge?`).
- `activeTab`: ID string of the currently selected tab.
- `onTabChange`: Callback fired with the new tab ID on selection.
- `mode`: `"auto"` (default), `"fit"` (stretches to fill container width), or `"scroll"` (horizontal ribbon with elevated edge chevron buttons and swipe capture).

### `<CodeBlock>`
Monospace viewer with safe nested horizontal scrolling and a 1-tap clipboard copy button with visual checkmark feedback.
```tsx
<CodeBlock code={sourceCode} language="typescript" title="index.ts" maxHeight={240} />
```

### `<KeyValue>` & `<KeyValueGroup>`
Displays key/value metadata. Automatically stacks vertically on compact/mobile screens and aligns horizontally on desktop. Use `<KeyValueGroup>` for responsive multi-column metric grids.
```tsx
<KeyValueGroup columns={2}>
  <KeyValue label="CPU Usage" value="14.2%" />
  <KeyValue label="RAM Used" value="3.2 GB" />
  <KeyValue label="IP Address" value="192.168.1.50" copyable mono />
  <KeyValue label="Uptime" value="3d 4h" />
</KeyValueGroup>
```

### `<ProgressBar>`
Visual gauge with automated threshold coloring (<75% green, 75-89% yellow, >=90% red).
```tsx
<ProgressBar value={82} max={100} showLabel label="RAM Usage" />
```

### `<MetricGauge>`
Circular metric gauge with center value slot and automated threshold coloring.
```tsx
<MetricGauge value={78} label="CPU Load" size={90} />
```

### `<DataTable>`
Responsive data table that automatically reflows to a structured card list on mobile and compact viewports.
```tsx
<DataTable
  data={processes}
  keyExtractor={(p) => String(p.pid)}
  columns={[
    { key: "name", header: "Process", render: (p) => <Text>{p.name}</Text> },
    { key: "cpu", header: "CPU %", align: "right", render: (p) => <Text>{p.cpu}%</Text> },
  ]}
/>
```

### `<SearchInput>`
Themed search input with magnifying glass icon and clear button.
```tsx
<SearchInput value={query} onChangeText={setQuery} placeholder="Filter processes..." />
```

### `<EmptyState>`
Placeholder view for empty lists or zero-state panels.
```tsx
<EmptyState
  icon="Inbox"
  title="No Peers Found"
  description="Start by pairing with a remote daemon."
  actionLabel="Add Peer"
  onAction={openAddModal}
/>
```

---

## 4. Layout Primitives

### `<ModalBody>`
A scrollable container for `<Modal.Content>` that automatically applies bottom padding (`paddingBottom: 48` on mobile) to clear OS home navigation bars and keyboards.
Supports native pull-to-refresh on mobile via `refreshing` and `onRefresh`.

```tsx
<Modal.Content>
  <ModalBody refreshing={isRefetching} onRefresh={refetch}>
    {/* controls and cards */}
  </ModalBody>
</Modal.Content>
```

### `<ActionBar>`
Toolbar container that renders buttons in a row with spacing on desktop, and automatically stacks them vertically with full width on mobile or compact panels.

```tsx
<ActionBar align="end">
  <Button label="Cancel" variant="ghost" onPress={close} />
  <Button label="Save Changes" variant="primary" onPress={save} />
</ActionBar>
```

### `<FormRow>`
Standardized form label and input layout container with responsive stacking.

```tsx
<FormRow label="Server Port" description="Local listening port">
  <TextInput value={port} onChangeText={setPort} keyboardType="numeric" />
</FormRow>
```

---

## 5. React Query Hooks

### `useRpcQuery(contract, input, options?)`
Invokes a Paseo RPC contract with React Query caching, deduplication, and automatic refetching.

```tsx
const { data, isLoading, refetch } = useRpcQuery(
  myStatusContract,
  { agentId },
  { refetchInterval: 5000 }
);
```

### `useRpcMutation(contract, options?)`
Executes an RPC contract mutation for write operations.

```tsx
const { mutate, isPending } = useRpcMutation(updateSettingContract, {
  onSuccess: () => queryClient.invalidateQueries([myStatusContract.name]),
});
```

### `useAutoRefreshQuery(contract, input, options?)`
Enhanced React Query hook for live polling metrics. Automatically halts background polling when modal/panel is closed (`isOpen === false`) to save battery and CPU on mobile, and provides selectable interval controls ("1s", "2s", "5s", "paused").

```tsx
const { data, rate, setRate, isPolling } = useAutoRefreshQuery(
  myStatusContract,
  { agentId },
  { defaultRate: "2s", isOpen: isModalOpen }
);
```

### `usePluginSettings(contract, options?)`
Reactive settings hook with **optimistic UI updates**, automatic error rollback, and background caching via React Query. Settings are never undefined (falls back to contract defaults).

```tsx
import { usePluginSettings, FormRow, Toggle, TextInput, Card } from "paseo-plugin-helper/client";
import { topSettingsContract } from "../shared/settings.js";

function SettingsTab() {
  const { settings, updateSettings, isUpdating, resetSettings } = usePluginSettings(topSettingsContract);

  return (
    <Card>
      <FormRow label="Show CPU & RAM" description="Display load in pill">
        <Toggle
          value={settings.showCpuRam}
          onValueChange={(val) => updateSettings({ showCpuRam: val })}
        />
      </FormRow>

      <FormRow label="Rotation Speed" description="Seconds between metric flips">
        <TextInput
          value={String(settings.rotationSeconds)}
          onChangeText={(text) => {
            const val = parseInt(text, 10);
            if (!isNaN(val)) updateSettings({ rotationSeconds: val });
          }}
          keyboardType="numeric"
        />
      </FormRow>
    </Card>
  );
}
```

---

## 6. Utilities

### `copyToClipboard(text, options?)`
Universal cross-platform copy function for Paseo plugins. Works reliably across React Native (Hermes / mobile webviews / touch events), desktop, and modern secure browsers.
Automatically integrates with Paseo's `useToast()` to display a toast notification on success.

```tsx
import { copyToClipboard, useToast } from "paseo-plugin-helper/client";

const toast = useToast();

const handleCopy = async () => {
  await copyToClipboard("192.168.1.50", {
    toast,
    toastMessage: "IP Address", // Displays "Copied IP Address to clipboard" or uses Paseo toast.copied
  });
};
```

### `triggerHaptic(type?)`
Triggers subtle tactile haptic vibration on mobile devices ("light", "medium", "heavy", "success", "warning", "error"). Gracefully degrades on unsupported platforms.

```tsx
import { triggerHaptic } from "paseo-plugin-helper/client";

const handlePress = () => {
  triggerHaptic("light");
  doAction();
};
```



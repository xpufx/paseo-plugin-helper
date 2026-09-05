import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { PluginClientContext } from "@getpaseo/plugin";
import {
  registerComposerPill,
  ModalBody,
  ActionBar,
  Card,
  Tabs,
  Badge,
  StatusDot,
  Button,
  KeyValue,
  KeyValueGroup,
  MetricGauge,
  ProgressBar,
  DataTable,
  SearchInput,
  EmptyState,
  CodeBlock,
  Toggle,
  triggerHaptic,
  usePluginTheme,
  useAutoRefreshQuery,
  useRpcMutation,
  type RenderModalProps,
  type RenderPillProps,
} from "paseo-plugin-helper/client";
import { formatBytes, formatUptime } from "paseo-plugin-helper/shared";
import {
  getDemoDataRpc,
  triggerDemoActionRpc,
  type DemoData,
} from "./demo.shared.js";
import { PLUGIN_VERSION } from "./version.js";

const EMPTY_PARAMS = {};

function DemoPill({ isOpen }: RenderPillProps) {
  const { colors } = usePluginTheme();
  const { data, isLoading } = useAutoRefreshQuery(getDemoDataRpc, EMPTY_PARAMS, {
    defaultRate: "2s",
  });

  const cpu = data?.cpuUsagePercent ?? 0;
  const mem = data?.memoryUsedPercent ?? 0;

  return (
    <View style={styles.pillRow}>
      <StatusDot variant={cpu > 80 ? "danger" : "success"} pulse={cpu > 80} />
      <Text numberOfLines={1} style={[styles.pillText, isOpen && styles.pillTextActive]}>
        <Text style={{ color: colors.accent, fontWeight: "600" }}>demo</Text>
        <Text style={{ color: colors.foregroundMuted }}>{" · "}</Text>
        <Text style={{ color: colors.foreground }}>{isLoading ? "..." : `${cpu}% CPU`}</Text>
      </Text>
    </View>
  );
}

function DemoModal({ close }: RenderModalProps) {
  const { colors } = usePluginTheme();
  const [activeTab, setActiveTab] = useState<string>("gauges");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [liveStream, setLiveStream] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const {
    data,
    isLoading,
    refetch,
    rate,
    setRate,
    isPolling,
  } = useAutoRefreshQuery(getDemoDataRpc, EMPTY_PARAMS, {
    defaultRate: "2s",
  });

  const { mutate: runAction, isPending: isActionPending } = useRpcMutation(
    triggerDemoActionRpc,
    {
      onSuccess: (res) => {
        triggerHaptic("success");
        setActionFeedback(res.message);
        refetch();
      },
    }
  );

  const items = data?.items ?? [];
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ModalBody
      refreshing={isLoading}
      onRefresh={async () => {
        triggerHaptic("light");
        await refetch();
      }}
    >
      {/* Top Banner Card */}
      <Card variant="elevated">
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Helper Showcase
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.foregroundMuted }]}>
              v0.2 UI Design System & Daemon Primitives
            </Text>
          </View>
          <Badge
            variant="accent"
            label={`Polling ${rate}`}
          />
        </View>

        {/* Refresh Interval Selector */}
        <View style={styles.rateControlRow}>
          <Text style={[styles.rateLabel, { color: colors.foregroundMuted }]}>
            Auto Refresh:
          </Text>
          {(["1s", "2s", "5s", "paused"] as const).map((r) => (
            <Button
              key={r}
              label={r}
              size="sm"
              variant={rate === r ? "primary" : "ghost"}
              onPress={() => {
                triggerHaptic("light");
                setRate(r);
              }}
            />
          ))}
        </View>
      </Card>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          triggerHaptic("light");
          setActiveTab(tab);
        }}
        tabs={[
          { id: "gauges", label: "Gauges & Hardware" },
          { id: "data", label: "Data Table" },
          { id: "controls", label: "Interactive Controls" },
        ]}
      />

      {/* TAB 1: GAUGES & HARDWARE */}
      {activeTab === "gauges" && (
        <>
          <Card variant="elevated">
            <Card.Header title="Metric Gauges" />
            <View style={styles.gaugesContainer}>
              <MetricGauge
                value={data?.cpuUsagePercent ?? 0}
                label="CPU Load"
                size={74}
              />
              <MetricGauge
                value={data?.memoryUsedPercent ?? 0}
                label="RAM Used"
                size={74}
              />
              <MetricGauge
                value={38}
                label="Disk I/O"
                size={74}
              />
            </View>
          </Card>

          <Card variant="elevated">
            <Card.Header title="Linear Progress" />
            <ProgressBar
              value={data?.cpuUsagePercent ?? 0}
              height={8}
            />
            <ProgressBar
              value={data?.memoryUsedPercent ?? 0}
              height={8}
            />
          </Card>

          <Card variant="elevated">
            <Card.Header title="Host & Network" />
            <KeyValueGroup columns={2}>
              <KeyValue
                label="Hostname"
                value={data?.hostname ?? "..."}
                copyable
              />
              <KeyValue
                label="Verified Daemon Port"
                value={data?.daemonPort ? String(data.daemonPort) : "..."}
                copyable
              />
            </KeyValueGroup>
            <KeyValue
              label="Processor"
              value={data?.cpuModel ?? "..."}
              subValue="Multi-line wrap verified"
              copyable
            />
            <KeyValue
              label="System Uptime"
              value={data ? formatUptime(data.uptimeSeconds) : "..."}
            />
          </Card>
        </>
      )}

      {/* TAB 2: DATA TABLE */}
      {activeTab === "data" && (
        <Card variant="elevated">
          <Card.Header title="Services Table (Mobile Reflow)" />
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search service name or category..."
          />

          <DataTable
            data={filteredItems}
            keyExtractor={(item) => item.id}
            emptyState={
              <EmptyState
                icon="Search"
                title="No Services Found"
                description="Try clearing your search query."
              />
            }
            columns={[
              {
                key: "name",
                header: "Service",
                flex: 2,
                render: (item) => (
                  <View>
                    <Text style={[styles.tableNameText, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.tableSubText, { color: colors.foregroundMuted }]}>
                      {item.category}
                    </Text>
                  </View>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "center",
                render: (item) => (
                  <Badge
                    label={item.status}
                    variant={item.status === "running" ? "success" : "warning"}
                  />
                ),
              },
              {
                key: "load",
                header: "Load",
                align: "right",
                render: (item) => (
                  <Text style={[styles.tableMetricText, { color: colors.foreground }]}>
                    {item.loadPercent}%
                  </Text>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* TAB 3: CONTROLS & CODE */}
      {activeTab === "controls" && (
        <>
          <Card variant="elevated">
            <Card.Header title="Toggles & Actions" />
            <Toggle
              label="Live Log Streaming"
              description="Stream background task ticks to console"
              value={liveStream}
              onValueChange={(val) => {
                triggerHaptic("medium");
                setLiveStream(val);
              }}
            />

            <Button
              label={isActionPending ? "Running RPC..." : "Trigger Background RPC Action"}
              variant="primary"
              onPress={() => runAction({ actionName: "Showcase Trigger" })}
            />

            {actionFeedback ? (
              <Text style={[styles.feedbackText, { color: colors.statusSuccess }]}>
                {actionFeedback}
              </Text>
            ) : null}
          </Card>

          <Card variant="elevated">
            <Card.Header title="Sample Code Block" />
            <CodeBlock
              language="typescript"
              code={`import { createPluginPill, MetricGauge } from "paseo-plugin-helper/client";\n\n// Renders circular ring\n<MetricGauge value={75} label="CPU Load" />`}
              copyable
            />
          </Card>
        </>
      )}

      {/* Footer */}
      <ActionBar align="flex-end">
        <Button
          label="Close"
          variant="ghost"
          onPress={() => {
            triggerHaptic("light");
            close();
          }}
        />
      </ActionBar>

      <View style={styles.versionFooter}>
        <Text style={[styles.versionText, { color: colors.foregroundMuted }]}>
          helper-demo v{data?.version ?? PLUGIN_VERSION} (tick #{data?.backgroundTicks ?? 0})
        </Text>
      </View>
    </ModalBody>
  );
}

export function contributeClient(client: PluginClientContext) {
  return registerComposerPill(client, {
    id: "helper-demo",
    title: "demo",
    modalTitle: "Showcase Demo",
    modalIcon: "Sliders",
    flair: {
      radius: "rounded",
      density: "comfortable",
      accentColor: "#6366f1",
    },
    renderPill: (props) => <DemoPill {...props} />,
    renderModal: (props) => <DemoModal {...props} />,
  });
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
  },
  pillText: {
    fontSize: 11,
    flexShrink: 1,
  },
  pillTextActive: {
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  titleCol: {
    gap: 2,
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 11,
    opacity: 0.7,
  },
  rateControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  rateLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  gaugesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 6,
  },
  tableNameText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tableSubText: {
    fontSize: 11,
  },
  tableMetricText: {
    fontSize: 13,
    fontWeight: "600",
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
  },
  versionFooter: {
    alignItems: "center",
    paddingVertical: 8,
  },
  versionText: {
    fontSize: 10,
    fontFamily: "monospace",
  },
});

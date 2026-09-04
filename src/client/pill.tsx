import React, { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  PluginClientContext,
  PluginCleanup,
  PluginComposerPillProps,
} from "@getpaseo/plugin";
import { Icon, Modal } from "@getpaseo/plugin/react-native";
import { PluginThemeProvider } from "./theme/provider.js";
import type { VisualFlair } from "./theme/flair.js";

export interface RenderModalProps extends PluginComposerPillProps {
  close: () => void;
}

export interface RegisterComposerPillOptions {
  /**
   * Unique ID for the pill (e.g. "paseo-top", "mcp-monitor").
   */
  id: string;

  /**
   * Title shown in the composer bar and modal header.
   */
  title: string;

  /**
   * Lucide icon name for the pill (e.g. "Cpu", "Server", "MessageSquare").
   */
  icon?: string;

  /**
   * Optional custom icon for the modal header (defaults to `icon`).
   */
  modalIcon?: string | ReactNode;

  /**
   * Optional visual flair preset or overrides for the plugin's theme.
   */
  flair?: Partial<VisualFlair>;

  /**
   * Optional custom badge text shown inside the pill (e.g. "LIVE", "3").
   */
  badgeText?: string;

  /**
   * Custom pill body renderer if you want to replace the default pill layout.
   */
  renderPill?: (props: PluginComposerPillProps) => ReactNode;

  /**
   * Renders the content inside the controlled modal.
   * Automatically wrapped with PluginThemeProvider and supplied with a `close()` helper.
   */
  renderModal: (props: RenderModalProps) => ReactNode;
}

/**
 * Registers an agent-scoped composer pill and modal lifecycle.
 * Manages agent subscription events, unmount cleanup, and pill-to-modal activation.
 */
export function registerComposerPill(
  client: PluginClientContext,
  options: RegisterComposerPillOptions,
): PluginCleanup {
  const openers = new Map<string, () => void>();
  const pills = new Map<string, () => void>();

  function PillHost(props: PluginComposerPillProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
      openers.set(props.agentId, () => setOpen(true));
      return () => {
        openers.delete(props.agentId);
      };
    }, [props.agentId]);

    const modalIcon =
      options.modalIcon ??
      (options.icon ? (
        <Icon name={options.icon} size={16} color={props.theme.colors.foreground} />
      ) : undefined);

    return (
      <PluginThemeProvider theme={props.theme} layout={props.layout} flair={options.flair}>
        {options.renderPill ? (
          options.renderPill(props)
        ) : (
          <DefaultPillBody
            title={options.title}
            icon={options.icon}
            badgeText={options.badgeText}
            theme={props.theme}
          />
        )}

        <Modal
          title={options.title}
          icon={modalIcon}
          open={open}
          onOpenChange={setOpen}
        >
          <Modal.Content>
            {options.renderModal({
              ...props,
              close: () => setOpen(false),
            })}
          </Modal.Content>
        </Modal>
      </PluginThemeProvider>
    );
  }

  function addPill(agentId: string, workspaceId: string) {
    if (pills.has(agentId)) return;
    const cleanup = client.addComposerPill({
      id: options.id,
      title: options.title,
      workspaceId,
      agentId,
      Component: PillHost,
      onPress() {
        const opener = openers.get(agentId);
        if (opener) opener();
      },
    });
    pills.set(agentId, cleanup);
  }

  function removePill(agentId: string) {
    pills.get(agentId)?.();
    pills.delete(agentId);
    openers.delete(agentId);
  }

  const unsubscribe = client.paseo.agents.subscribe((update) => {
    if (update.kind === "remove") {
      removePill(update.agentId);
      return;
    }
    const { id, workspaceId } = update.agent;
    if (workspaceId) addPill(id, workspaceId);
  });

  client.paseo.agents
    .list()
    .then((result) => {
      for (const { agent } of result.entries) {
        if (agent.workspaceId) addPill(agent.id, agent.workspaceId);
      }
    })
    .catch(() => {});

  return () => {
    unsubscribe();
    for (const dispose of pills.values()) {
      dispose();
    }
    pills.clear();
    openers.clear();
  };
}

function DefaultPillBody({
  title,
  icon,
  badgeText,
  theme,
}: {
  title: string;
  icon?: string;
  badgeText?: string;
  theme: PluginComposerPillProps["theme"];
}) {
  return (
    <View style={pillStyles.container}>
      {icon ? <Icon name={icon} size={12} color={theme.colors.foregroundMuted} /> : null}
      <Text style={[pillStyles.title, { color: theme.colors.foreground }]}>{title}</Text>
      {badgeText ? (
        <View style={[pillStyles.badge, { backgroundColor: theme.colors.surface2 }]}>
          <Text style={[pillStyles.badgeText, { color: theme.colors.foregroundMuted }]}>
            {badgeText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  PluginClientContext,
  PluginCleanup,
  PluginComposerPillProps,
} from "@getpaseo/plugin";
import { Icon, Modal } from "@getpaseo/plugin/react-native";
import { PluginThemeProvider } from "./theme/provider.js";
import type { VisualFlair } from "./theme/flair.js";

export interface RenderPillProps extends PluginComposerPillProps {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface RenderModalProps extends PluginComposerPillProps {
  close: () => void;
}

export interface RegisterComposerPillOptions {
  /**
   * Unique ID for the pill (e.g. "paseo-top", "mcp-monitor").
   */
  id: string;

  /**
   * Title shown in the composer trackbar (keep concise, e.g. "top", "CPU 12%").
   */
  title: string;

  /**
   * Optional custom title shown in the modal header (defaults to `title`).
   * Useful when the modal needs a full descriptive title (e.g. "Host System Resources").
   */
  modalTitle?: string;

  /**
   * Lucide icon name for the pill (e.g. "Cpu", "Server", "MessageSquare").
   */
  icon?: string;

  /**
   * Optional custom icon for the modal header. Can be a Lucide icon name string or a JSX element.
   * If omitted, falls back to `icon`.
   */
  modalIcon?: string | ReactNode;

  /**
   * Optional visual flair preset or overrides for the plugin's theme.
   */
  flair?: Partial<VisualFlair>;

  /**
   * Optional custom badge text shown inside the default pill (e.g. "LIVE", "3").
   */
  badgeText?: string;

  /**
   * Custom pill body renderer if you want to replace the default pill layout.
   * Receives `isOpen`, `open`, `close`, and `toggle` along with standard pill props.
   */
  renderPill?: (props: RenderPillProps) => ReactNode;

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

    const effectiveModalTitle = options.modalTitle ?? options.title;

    const modalIconElement = useMemo(() => {
      if (React.isValidElement(options.modalIcon)) {
        return options.modalIcon;
      }
      const iconName =
        typeof options.modalIcon === "string" ? options.modalIcon : options.icon;
      if (iconName) {
        return <Icon name={iconName} size={16} color={props.theme.colors.foreground} />;
      }
      return undefined;
    }, [options.modalIcon, options.icon, props.theme.colors.foreground]);

    const renderPillProps: RenderPillProps = {
      ...props,
      isOpen: open,
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((prev) => !prev),
    };

    return (
      <PluginThemeProvider theme={props.theme} layout={props.layout} flair={options.flair}>
        {options.renderPill ? (
          options.renderPill(renderPillProps)
        ) : (
          <DefaultPillBody
            title={options.title}
            icon={options.icon}
            badgeText={options.badgeText}
            theme={props.theme}
          />
        )}

        <Modal
          title={effectiveModalTitle}
          icon={modalIconElement}
          open={open}
          onOpenChange={setOpen}
        >
          <Modal.Content>
            <PluginThemeProvider theme={props.theme} layout={props.layout} flair={options.flair}>
              {options.renderModal({
                ...props,
                close: () => setOpen(false),
              })}
            </PluginThemeProvider>
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

interface DefaultPillBodyProps {
  title: string;
  icon?: string;
  badgeText?: string;
  theme: PluginComposerPillProps["theme"];
}

function DefaultPillBody({ title, icon, badgeText, theme }: DefaultPillBodyProps) {
  return (
    <View style={styles.pillContainer}>
      {icon && <Icon name={icon} size={13} color={theme.colors.foreground} />}
      <Text style={[styles.title, { color: theme.colors.foreground }]}>{title}</Text>
      {badgeText && (
        <View style={[styles.badge, { backgroundColor: theme.colors.surface1 }]}>
          <Text style={[styles.badgeText, { color: theme.colors.foregroundMuted }]}>
            {badgeText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

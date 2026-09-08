import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  PluginClientContext,
  PluginComposerPillProps,
} from "@getpaseo/plugin/client";
import type { PluginCleanup } from "@getpaseo/plugin";
import { Icon, Modal } from "@getpaseo/plugin/client/react-native";
import { PluginThemeProvider } from "./theme/provider.js";
import { useResponsive } from "./theme/useResponsive.js";
import type { VisualFlair } from "./theme/flair.js";

export interface RenderPillProps<TPayload = any> extends PluginComposerPillProps {
  isOpen: boolean;
  open: (payload?: TPayload) => void;
  close: () => void;
  toggle: (payload?: TPayload) => void;
}

export interface RenderModalProps<TPayload = any> extends PluginComposerPillProps {
  close: () => void;
  payload?: TPayload;
}

export interface RegisterComposerPillOptions<TPayload = any> {
  /**
   * Unique ID for the pill (e.g. "paseo-top", "mcp-monitor").
   */
  id: string;

  /**
   * Title shown in the composer trackbar (keep concise, e.g. "top", "CPU 12%").
   */
  title: string;

  /**
   * Optional compact title shown in the composer trackbar when screen or track is narrow/mobile
   * (when `layout.compact` is true). Defaults to `title`.
   */
  compactTitle?: string;

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
   * Optional compact Lucide icon name shown when in compact mode. Defaults to `icon`.\
   */
  compactIcon?: string;

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
   * Optional compact badge text shown inside the default pill in compact mode. Defaults to `badgeText`.
   */
  compactBadgeText?: string;

  /**
   * Optional callback to resolve default payload when the outer host pill is clicked.
   * Receives agentId and workspaceId.
   */
  resolveDefaultPayload?: (context: { agentId: string; workspaceId: string }) => TPayload | undefined;

  /**
   * Custom pill body renderer if you want to replace the default pill layout.
   * Receives `isOpen`, `open`, `close`, and `toggle` along with standard pill props.
   */
  renderPill?: (props: RenderPillProps<TPayload>) => ReactNode;

  /**
   * Renders the content inside the controlled modal.
   * Automatically wrapped with PluginThemeProvider and supplied with a `close()` helper and optional payload.
   */
  renderModal: (props: RenderModalProps<TPayload>) => ReactNode;
}

/**
 * Registers an agent-scoped composer pill and modal lifecycle.
 * Manages agent subscription events, unmount cleanup, and pill-to-modal activation.
 */
export function registerComposerPill<TPayload = any>(
  client: PluginClientContext,
  options: RegisterComposerPillOptions<TPayload>,
): PluginCleanup {
  const openers = new Map<string, (payload?: TPayload) => void>();
  const pills = new Map<string, () => void>();

  function PillHost(props: PluginComposerPillProps) {
    const [open, setOpen] = useState(false);
    const [payload, setPayload] = useState<TPayload | undefined>(undefined);

    useEffect(() => {
      openers.set(props.agentId, (incomingPayload?: TPayload) => {
        setPayload(incomingPayload);
        setOpen(true);
      });
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

    const renderPillProps: RenderPillProps<TPayload> = {
      ...props,
      isOpen: open,
      open: (customPayload?: TPayload) => {
        setPayload(customPayload);
        setOpen(true);
      },
      close: () => setOpen(false),
      toggle: (customPayload?: TPayload) => {
        setPayload(customPayload);
        setOpen((prev) => !prev);
      },
    };

    return (
      <PluginThemeProvider theme={props.theme} layout={props.layout} flair={options.flair}>
        {options.renderPill ? (
          options.renderPill(renderPillProps)
        ) : (
          <DefaultPillBody
            title={options.title}
            compactTitle={options.compactTitle}
            icon={options.icon}
            compactIcon={options.compactIcon}
            badgeText={options.badgeText}
            compactBadgeText={options.compactBadgeText}
            theme={props.theme}
          />
        )}

        <Modal
          title={effectiveModalTitle}
          icon={modalIconElement}
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
              setPayload(undefined);
            }
          }}
        >
          <Modal.Content>
            {open ? (
              <PluginThemeProvider theme={props.theme} layout={props.layout} flair={options.flair}>
                {options.renderModal({
                  ...props,
                  close: () => setOpen(false),
                  payload,
                })}
              </PluginThemeProvider>
            ) : null}
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
        if (opener) {
          const defaultPayload = options.resolveDefaultPayload?.({ agentId, workspaceId });
          opener(defaultPayload);
        }
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
  compactTitle?: string;
  icon?: string;
  compactIcon?: string;
  badgeText?: string;
  compactBadgeText?: string;
  theme: PluginComposerPillProps["theme"];
}

function DefaultPillBody({
  title,
  compactTitle,
  icon,
  compactIcon,
  badgeText,
  compactBadgeText,
  theme,
}: DefaultPillBodyProps) {
  const { isCompact } = useResponsive();

  const effectiveTitle = isCompact && compactTitle ? compactTitle : title;
  const effectiveIcon = isCompact && compactIcon ? compactIcon : icon;
  const effectiveBadge =
    isCompact && compactBadgeText !== undefined ? compactBadgeText : badgeText;

  return (
    <View style={styles.pillContainer}>
      {effectiveIcon && <Icon name={effectiveIcon} size={13} color={theme.colors.foreground} />}
      {effectiveTitle ? (
        <Text style={[styles.title, { color: theme.colors.foreground }]}>{effectiveTitle}</Text>
      ) : null}
      {effectiveBadge && (
        <View style={[styles.badge, { backgroundColor: theme.colors.surface1 }]}>
          <Text style={[styles.badgeText, { color: theme.colors.foregroundMuted }]}>
            {effectiveBadge}
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

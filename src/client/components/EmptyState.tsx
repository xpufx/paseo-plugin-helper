import React, { type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Icon } from "@getpaseo/plugin/react-native";
import { usePluginTheme } from "../theme/provider.js";
import { Button, type ButtonProps } from "./Button.js";

export interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description?: string;
  action?: ButtonProps;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ icon = "Inbox", title, description, action, style }: EmptyStateProps) {
  const { colors, isCompact } = usePluginTheme();

  return (
    <View style={[styles.container, { padding: isCompact ? 20 : 32 }, style]}>
      {icon ? (
        typeof icon === "string" ? (
          <View style={[styles.iconWrapper, { backgroundColor: colors.surface1 }]}>
            <Icon name={icon} size={isCompact ? 24 : 32} color={colors.foregroundMuted} />
          </View>
        ) : (
          icon
        )
      ) : null}

      <Text style={[styles.title, { color: colors.foreground, fontSize: isCompact ? 14 : 16 }]}>
        {title}
      </Text>

      {description ? (
        <Text
          style={[
            styles.description,
            { color: colors.foregroundMuted, fontSize: isCompact ? 12 : 13 },
          ]}
        >
          {description}
        </Text>
      ) : null}

      {action ? (
        <View style={styles.actionRow}>
          <Button size={isCompact ? "sm" : "md"} {...action} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontWeight: "600",
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 8,
  },
});

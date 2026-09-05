import React, { type ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { usePluginTheme } from "../theme/provider.js";

export interface ModalBodyProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraBottomInset?: number;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
}

/**
 * Mobile-safe scrollable body for Paseo <Modal.Content>.
 * Automatically calculates responsive bottom padding so controls are not cut off
 * by mobile home bars or virtual keyboards.
 * Supports pull-to-refresh on mobile via `refreshing` and `onRefresh`.
 */
export function ModalBody({
  children,
  style,
  contentContainerStyle,
  extraBottomInset = 0,
  refreshing = false,
  onRefresh,
}: ModalBodyProps) {
  const { isCompact, padding, colors } = usePluginTheme();

  // On mobile/compact, we reserve generous bottom padding to clear navigation bars
  const bottomPadding = (isCompact ? 48 : 20) + extraBottomInset;

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.accent}
      colors={[colors.accent]}
    />
  ) : undefined;

  if (isCompact) {
    return (
      <View
        style={[
          styles.content,
          {
            backgroundColor: colors.surface0,
            paddingHorizontal: padding.horizontal,
            paddingTop: padding.vertical,
            paddingBottom: bottomPadding,
            gap: padding.gap,
          },
          style,
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[{ backgroundColor: colors.surface0 }, styles.container, style]}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      refreshControl={refreshControl}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: padding.horizontal,
          paddingTop: padding.vertical,
          paddingBottom: bottomPadding,
          gap: padding.gap,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: "100%",
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: "100%",
  },
});

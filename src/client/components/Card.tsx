import React, { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { usePluginTheme } from "../theme/provider.js";
import type { SurfaceStyle } from "../theme/flair.js";

export interface CardProps {
  children: ReactNode;
  variant?: SurfaceStyle;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

export function Card({ children, variant, style, noPadding = false }: CardProps) {
  const { colors, flair, resolveRadius, isCompact, alpha } = usePluginTheme();

  const effectiveVariant = variant || flair.surfaceStyle;
  const radius = resolveRadius("md");

  let bg = colors.surface0;
  let border = colors.border;

  if (effectiveVariant === "tinted") {
    bg = alpha(colors.accent, 0.04);
    border = alpha(colors.accent, 0.2);
  } else if (effectiveVariant === "elevated") {
    bg = colors.surface1;
    border = colors.border;
  }

  const padding = noPadding ? 0 : isCompact ? 12 : 16;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: radius,
          borderWidth: flair.borderWidth,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
});

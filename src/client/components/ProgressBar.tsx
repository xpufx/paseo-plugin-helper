import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { usePluginTheme } from "../theme/provider.js";

export interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string;
  autoStatusColor?: boolean;
  label?: string;
  showValueText?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  value,
  color,
  autoStatusColor = true,
  label,
  showValueText = false,
  height = 8,
  style,
}: ProgressBarProps) {
  const { colors, resolveRadius, isCompact } = usePluginTheme();

  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const radius = resolveRadius("pill");

  let barColor = color || colors.accent;
  if (!color && autoStatusColor) {
    if (clamped >= 90) {
      barColor = colors.statusDanger;
    } else if (clamped >= 75) {
      barColor = colors.statusWarning;
    } else {
      barColor = colors.statusSuccess;
    }
  }

  return (
    <View style={[styles.container, style]}>
      {(label || showValueText) && (
        <View style={styles.labelRow}>
          {label ? (
            <Text style={[styles.labelText, { color: colors.foregroundMuted, fontSize: isCompact ? 11 : 12 }]}>
              {label}
            </Text>
          ) : null}
          {showValueText ? (
            <Text style={[styles.valueText, { color: colors.foreground, fontSize: isCompact ? 11 : 12 }]}>
              {Math.round(clamped)}%
            </Text>
          ) : null}
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.surface2,
            height,
            borderRadius: radius,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: barColor,
              borderRadius: radius,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  labelText: {
    fontWeight: "500",
  },
  valueText: {
    fontWeight: "600",
  },
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});

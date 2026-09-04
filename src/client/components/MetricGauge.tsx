import React, { type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { usePluginTheme } from "../theme/provider.js";
import { resolveMetricStatus, type MetricThresholds } from "../../shared/formatters.js";

export interface MetricGaugeProps {
  value: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  thresholds?: MetricThresholds;
  color?: string;
  autoStatusColor?: boolean;
  label?: string;
  showPercent?: boolean;
  centerSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Clean circular metric gauge built with pure React Native components.
 * Displays a percentage meter with automated threshold coloring and center value slot.
 */
export function MetricGauge({
  value,
  size = 80,
  strokeWidth = 8,
  thresholds,
  color,
  autoStatusColor = true,
  label,
  showPercent = true,
  centerSlot,
  style,
}: MetricGaugeProps) {
  const { colors } = usePluginTheme();

  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  let gaugeColor = color || colors.accent;
  if (!color && autoStatusColor) {
    const status = resolveMetricStatus(clamped, thresholds);
    if (status === "danger") {
      gaugeColor = colors.statusDanger;
    } else if (status === "warning") {
      gaugeColor = colors.statusWarning;
    } else {
      gaugeColor = colors.statusSuccess;
    }
  }

  const radius = size / 2;
  const innerRadius = radius - strokeWidth;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.gaugeContainer,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderColor: colors.surface2,
            borderWidth: strokeWidth,
          },
        ]}
      >
        {/* Dynamic fill indicator */}
        <View
          style={[
            styles.fillIndicator,
            {
              width: size,
              height: size,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: gaugeColor,
              opacity: clamped > 0 ? 1 : 0.2,
            },
          ]}
        />

        {/* Center Content Slot */}
        <View
          style={[
            styles.centerSlot,
            {
              width: innerRadius * 2,
              height: innerRadius * 2,
              borderRadius: innerRadius,
            },
          ]}
        >
          {centerSlot ? (
            centerSlot
          ) : showPercent ? (
            <Text style={[styles.percentText, { color: colors.foreground }]}>
              {Math.round(clamped)}%
            </Text>
          ) : null}
        </View>
      </View>

      {label ? (
        <Text style={[styles.labelText, { color: colors.foregroundMuted }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  gaugeContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  fillIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  centerSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    fontSize: 14,
    fontWeight: "700",
  },
  labelText: {
    fontSize: 11,
    fontWeight: "500",
  },
});

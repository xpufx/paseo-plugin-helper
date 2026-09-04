import React, { useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Icon } from "@getpaseo/plugin/react-native";
import { usePluginTheme } from "../theme/provider.js";

export interface KeyValueProps {
  label: string;
  value: string | number | null | undefined;
  subValue?: string;
  mono?: boolean;
  copyable?: boolean;
  stackOnCompact?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

export function KeyValue({
  label,
  value,
  subValue,
  mono = false,
  copyable = false,
  stackOnCompact = true,
  style,
  labelStyle,
  valueStyle,
}: KeyValueProps) {
  const { colors, flair, isCompact, touchTargetMin } = usePluginTheme();
  const [copied, setCopied] = useState(false);

  const displayValue = value === null || value === undefined ? "—" : String(value);

  const handleCopy = async () => {
    if (!copyable || !value) return;
    try {
      const globalObj = typeof globalThis !== "undefined" ? (globalThis as any) : {};
      const clipboard = globalObj.navigator?.clipboard;
      if (clipboard?.writeText) {
        await clipboard.writeText(String(value));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const fontFamily = mono
    ? Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })
    : undefined;

  const shouldStack = stackOnCompact && isCompact;

  return (
    <View
      style={[
        styles.container,
        shouldStack ? styles.stackedContainer : styles.rowContainer,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: colors.foregroundMuted,
            fontSize: isCompact ? 11 : 12,
            textTransform: flair.headingTransform === "uppercase" ? "uppercase" : "none",
          },
          labelStyle,
        ]}
      >
        {label}
      </Text>

      <View style={[styles.valueWrapper, shouldStack ? styles.stackedValue : styles.rowValue]}>
        <Text
          selectable
          style={[
            styles.value,
            {
              color: colors.foreground,
              fontSize: isCompact ? 12 : 13,
              fontFamily,
            },
            valueStyle,
          ]}
        >
          {displayValue}
        </Text>

        {subValue && (
          <Text style={[styles.subValue, { color: colors.foregroundMuted, fontSize: 11 }]}>
            {subValue}
          </Text>
        )}

        {copyable && value ? (
          <Pressable
            onPress={handleCopy}
            hitSlop={Math.max(0, (touchTargetMin - 24) / 2)}
            style={styles.copyBtn}
          >
            <Icon
              name={copied ? "Check" : "Copy"}
              size={11}
              color={copied ? colors.statusSuccess : colors.foregroundMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export interface KeyValueGroupProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

export function KeyValueGroup({
  children,
  columns = 2,
  gap = 12,
  style,
}: KeyValueGroupProps) {
  const { isCompact } = usePluginTheme();
  const effectiveColumns = isCompact ? 1 : columns;

  const childArray = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.groupContainer, { gap }, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{
            flexGrow: 1,
            flexShrink: 0,
            flexBasis: `${Math.floor(100 / effectiveColumns) - 2}%`,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stackedContainer: {
    flexDirection: "column",
    gap: 2,
  },
  groupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  label: {
    fontWeight: "500",
  },
  valueWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: {
    justifyContent: "flex-end",
  },
  stackedValue: {
    justifyContent: "flex-start",
  },
  value: {
    fontWeight: "600",
  },
  subValue: {
    fontWeight: "400",
  },
  copyBtn: {
    padding: 2,
  },
});

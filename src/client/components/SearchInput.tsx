import React from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Icon } from "@getpaseo/plugin/react-native";
import { usePluginTheme } from "../theme/provider.js";

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Search…",
  onClear,
  onSubmitEditing,
  style,
  inputStyle,
  autoFocus = false,
}: SearchInputProps) {
  const { colors, resolveRadius, touchTargetMin, isCompact } = usePluginTheme();

  const radius = resolveRadius("md");

  const handleClear = () => {
    onChangeText("");
    if (onClear) onClear();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface1,
          borderColor: colors.border,
          borderRadius: radius,
          minHeight: Math.max(34, touchTargetMin - 4),
        },
        style,
      ]}
    >
      <Icon name="Search" size={14} color={colors.foregroundMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.foregroundMuted}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={[
          styles.input,
          {
            color: colors.foreground,
            fontSize: isCompact ? 13 : 14,
          },
          inputStyle,
        ]}
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          hitSlop={Math.max(0, (touchTargetMin - 24) / 2)}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clearButton}
        >
          <Icon name="X" size={13} color={colors.foregroundMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 6,
  },
  clearButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});

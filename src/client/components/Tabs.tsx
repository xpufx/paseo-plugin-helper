import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Icon } from "@getpaseo/plugin/react-native";
import { usePluginTheme } from "../theme/provider.js";

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function Tabs({ tabs, activeTab, onTabChange, style }: TabsProps) {
  const { colors, resolveRadius, touchTargetMin, isCompact, alpha } = usePluginTheme();

  const radius = resolveRadius("sm");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.surface1,
            borderRadius: radius,
            borderColor: colors.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.tab,
                {
                  borderRadius: radius - 2,
                  minHeight: Math.max(32, touchTargetMin - 6),
                  backgroundColor: isActive
                    ? colors.surface2
                    : pressed
                      ? alpha(colors.surface2, 0.5)
                      : "transparent",
                  paddingHorizontal: isCompact ? 10 : 14,
                  paddingVertical: isCompact ? 5 : 7,
                },
              ]}
            >
              {tab.icon ? (
                <Icon
                  name={tab.icon}
                  size={isCompact ? 12 : 14}
                  color={isActive ? colors.foreground : colors.foregroundMuted}
                />
              ) : null}
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.foreground : colors.foregroundMuted,
                    fontSize: isCompact ? 12 : 13,
                    fontWeight: isActive ? "600" : "500",
                  },
                ]}
              >
                {tab.label}
              </Text>
              {tab.badge !== undefined ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isActive ? colors.accent : alpha(colors.foregroundMuted, 0.2),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: isActive
                          ? colors.accentForeground || "#ffffff"
                          : colors.foregroundMuted,
                      },
                    ]}
                  >
                    {tab.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  track: {
    flexDirection: "row",
    padding: 3,
    borderWidth: 1,
    gap: 2,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabText: {},
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});

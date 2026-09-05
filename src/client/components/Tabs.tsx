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
  mode?: "auto" | "fit" | "scroll";
  style?: StyleProp<ViewStyle>;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  mode = "auto",
  style,
}: TabsProps) {
  const { colors, resolveRadius, touchTargetMin, isCompact, alpha } = usePluginTheme();

  const radius = resolveRadius("sm");

  // On compact/mobile or with <= 4 tabs, prefer a full-width fitting track so tabs don't overflow or require horizontal scroll
  const shouldFit = mode === "fit" || (mode === "auto" && (isCompact || tabs.length <= 4));

  const renderTabList = () => (
    <View
      style={[
        styles.track,
        shouldFit && styles.trackFit,
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
              shouldFit && styles.tabFit,
              {
                borderRadius: radius - 2,
                minHeight: Math.max(30, touchTargetMin - 8),
                backgroundColor: isActive
                  ? colors.surface2
                  : pressed
                    ? alpha(colors.surface2, 0.5)
                    : "transparent",
                paddingHorizontal: isCompact ? 6 : 12,
                paddingVertical: isCompact ? 5 : 6,
              },
            ]}
          >
            {tab.icon ? (
              <Icon
                name={tab.icon}
                size={isCompact ? 11 : 13}
                color={isActive ? colors.foreground : colors.foregroundMuted}
              />
            ) : null}
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                {
                  color: isActive ? colors.foreground : colors.foregroundMuted,
                  fontSize: isCompact ? 11 : 12,
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
  );

  if (shouldFit) {
    return <View style={[styles.containerFit, style]}>{renderTabList()}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {renderTabList()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  containerFit: {
    width: "100%",
  },
  track: {
    flexDirection: "row",
    padding: 3,
    borderWidth: 1,
    gap: 2,
  },
  trackFit: {
    width: "100%",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  tabFit: {
    flex: 1,
  },
  tabText: {
    textAlign: "center",
  },
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

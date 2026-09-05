import React, { useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Icon } from "@getpaseo/plugin/react-native";
import { usePluginTheme } from "../theme/provider.js";

export interface TabItem {
  id: string;
  label: string;
  /**
   * Optional abbreviated label for compact viewports in fit mode.
   * e.g. label: "Interactive Controls", shortLabel: "Controls"
   */
  shortLabel?: string;
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
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  const radius = resolveRadius("sm");

  // On compact/mobile or with <= 4 tabs, auto mode defaults to full-width fitting track
  const shouldFit = mode === "fit" || (mode === "auto" && (isCompact || tabs.length <= 4));

  // When in scroll mode, auto-scroll to center the active tab if it's selected
  useEffect(() => {
    if (!shouldFit && scrollRef.current && tabLayouts.current[activeTab]) {
      const { x, width } = tabLayouts.current[activeTab];
      scrollRef.current.scrollTo({
        x: Math.max(0, x - 40),
        animated: true,
      });
    }
  }, [activeTab, shouldFit]);

  const handleTabLayout = (tabId: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current[tabId] = { x, width };
  };

  const renderTabList = () => (
    <View
      style={[
        styles.track,
        shouldFit ? styles.trackFit : styles.trackScroll,
        {
          backgroundColor: colors.surface1,
          borderRadius: radius,
          borderColor: colors.border,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const displayLabel = shouldFit && isCompact && tab.shortLabel ? tab.shortLabel : tab.label;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            onLayout={(e) => handleTabLayout(tab.id, e)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.tab,
              shouldFit ? styles.tabFit : styles.tabScroll,
              {
                borderRadius: radius - 2,
                minHeight: Math.max(30, touchTargetMin - 8),
                backgroundColor: isActive
                  ? colors.surface2
                  : pressed
                    ? alpha(colors.surface2, 0.5)
                    : "transparent",
                paddingHorizontal: shouldFit ? (isCompact ? 6 : 12) : 14,
                paddingVertical: isCompact ? 5 : 7,
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
              {displayLabel}
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
      ref={scrollRef}
      horizontal
      nestedScrollEnabled={true}
      directionalLockEnabled={true}
      showsHorizontalScrollIndicator={false}
      style={[styles.scrollView, style]}
      contentContainerStyle={styles.containerScroll}
    >
      {renderTabList()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  containerFit: {
    width: "100%",
  },
  scrollView: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  containerScroll: {
    flexDirection: "row",
    alignItems: "center",
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
  trackScroll: {
    flexShrink: 0,
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
  tabScroll: {
    flexShrink: 0,
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

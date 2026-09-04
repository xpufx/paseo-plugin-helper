import type { PluginTheme, PluginHostProps } from "@getpaseo/plugin";

export type { PluginTheme, PluginHostProps };

export type ThemeColors = PluginTheme["colors"];

export type PlatformType = "ios" | "android" | "web";

export interface ResponsiveLayout {
  compact: boolean;
  platform: PlatformType;
}

export type StatusVariant = "neutral" | "success" | "warning" | "danger" | "accent" | "info";

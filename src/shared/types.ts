import type { PluginTheme } from "@getpaseo/plugin";

export type { PluginTheme };

export type ThemeColors = PluginTheme["colors"];

export type PlatformType = "ios" | "android" | "web";

export interface ResponsiveLayout {
  compact: boolean;
  platform: PlatformType;
  width?: number;
  height?: number;
}

export type StatusVariant = "neutral" | "success" | "warning" | "danger" | "accent" | "info";

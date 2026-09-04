import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PluginTheme, PluginHostProps } from "@getpaseo/plugin";
import { defaultFlair, resolveRadius, type VisualFlair } from "./flair.js";
import { alpha, getContrastColor, getStatusColor, getVariantPalette } from "./color-utils.js";
import { getTouchTargetMin, isMobilePlatform, resolvePadding } from "./responsive.js";
import type { ResponsiveLayout, StatusVariant, ThemeColors } from "../../shared/types.js";

export interface PluginThemeContextValue {
  theme: PluginTheme;
  colors: ThemeColors;
  layout: ResponsiveLayout;
  flair: VisualFlair;
  isCompact: boolean;
  isMobile: boolean;
  touchTargetMin: number;
  alpha: (color: string, opacity: number) => string;
  getContrastColor: (bgHex: string, light?: string, dark?: string) => string;
  getStatusColor: (variant: StatusVariant) => string;
  getVariantPalette: (variant: StatusVariant) => { bg: string; text: string; border: string };
  resolveRadius: (size?: "xs" | "sm" | "md" | "lg" | "pill") => number;
  padding: { horizontal: number; vertical: number; gap: number };
}

const defaultLayout: ResponsiveLayout = {
  compact: false,
  platform: "web",
};

const defaultTheme: PluginTheme = {
  colors: {
    surface0: "#18181b",
    surface1: "#27272a",
    surface2: "#3f3f46",
    border: "#3f3f46",
    foreground: "#fafafa",
    foregroundMuted: "#a1a1aa",
    accent: "#3b82f6",
    accentForeground: "#ffffff",
    statusSuccess: "#22c55e",
    statusWarning: "#eab308",
    statusDanger: "#ef4444",
  },
};

const PluginThemeContext = createContext<PluginThemeContextValue>({
  theme: defaultTheme,
  colors: defaultTheme.colors,
  layout: defaultLayout,
  flair: defaultFlair,
  isCompact: false,
  isMobile: false,
  touchTargetMin: 28,
  alpha: (color, op) => alpha(color, op),
  getContrastColor: (bg, l, d) => getContrastColor(bg, l, d),
  getStatusColor: (v) => getStatusColor(v, defaultTheme.colors),
  getVariantPalette: (v) => getVariantPalette(v, defaultTheme.colors),
  resolveRadius: (s) => resolveRadius("rounded", s),
  padding: resolvePadding(defaultLayout, "comfortable"),
});

export interface PluginThemeProviderProps {
  theme: PluginTheme;
  layout?: PluginHostProps["layout"];
  flair?: Partial<VisualFlair>;
  children: ReactNode;
}

export function PluginThemeProvider({
  theme,
  layout = defaultLayout,
  flair: userFlair,
  children,
}: PluginThemeProviderProps) {
  const value = useMemo<PluginThemeContextValue>(() => {
    const flair: VisualFlair = { ...defaultFlair, ...userFlair };
    const effectiveColors: ThemeColors = {
      ...theme.colors,
      ...(flair.accentColor ? { accent: flair.accentColor } : {}),
    };

    const isCompact = Boolean(layout.compact);
    const isMobile = isMobilePlatform(layout.platform);
    const touchTargetMin = getTouchTargetMin(layout);
    const padding = resolvePadding(layout, flair.density);

    return {
      theme,
      colors: effectiveColors,
      layout,
      flair,
      isCompact,
      isMobile,
      touchTargetMin,
      alpha: (c, o) => alpha(c, o),
      getContrastColor: (bg, l, d) => getContrastColor(bg, l, d),
      getStatusColor: (v) => getStatusColor(v, effectiveColors, flair.accentColor),
      getVariantPalette: (v) => getVariantPalette(v, effectiveColors, flair.accentColor),
      resolveRadius: (size = "md") => resolveRadius(flair.radius, size),
      padding,
    };
  }, [theme, layout, userFlair]);

  return <PluginThemeContext.Provider value={value}>{children}</PluginThemeContext.Provider>;
}

export function usePluginTheme(): PluginThemeContextValue {
  return useContext(PluginThemeContext);
}

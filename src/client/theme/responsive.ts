import type { DensityStyle } from "./flair.js";
import type { PlatformType, ResponsiveLayout } from "../../shared/types.js";

/**
 * Checks if the current platform is mobile (iOS or Android).
 */
export function isMobilePlatform(platform: PlatformType): boolean {
  return platform === "ios" || platform === "android";
}

/**
 * Returns the recommended minimum interactive touch target size (in pt/px).
 * Ensures compliance with Apple HIG and Android Material guidelines (min 44pt).
 */
export function getTouchTargetMin(layout: ResponsiveLayout): number {
  return layout.compact || isMobilePlatform(layout.platform) ? 44 : 28;
}

/**
 * Selects a value based on compact/mobile vs desktop screen constraints.
 */
export function responsiveValue<T>(layout: ResponsiveLayout, desktopVal: T, compactVal: T): T {
  return layout.compact ? compactVal : desktopVal;
}

/**
 * Calculates adaptive padding based on compact mode and density preset.
 */
export function resolvePadding(
  layout: ResponsiveLayout,
  density: DensityStyle,
): { horizontal: number; vertical: number; gap: number } {
  const isCompact = layout.compact;

  switch (density) {
    case "compact":
      return {
        horizontal: isCompact ? 10 : 12,
        vertical: isCompact ? 6 : 8,
        gap: isCompact ? 6 : 8,
      };
    case "spacious":
      return {
        horizontal: isCompact ? 16 : 24,
        vertical: isCompact ? 14 : 20,
        gap: isCompact ? 12 : 16,
      };
    case "comfortable":
    default:
      return {
        horizontal: isCompact ? 12 : 16,
        vertical: isCompact ? 10 : 14,
        gap: isCompact ? 8 : 12,
      };
  }
}

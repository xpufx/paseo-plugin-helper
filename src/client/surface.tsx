import React, { type ComponentType } from "react";
import type {
  PluginContext,
  PluginSurfaceProps,
} from "@getpaseo/plugin";
import { PluginThemeProvider } from "./theme/provider.js";
import type { VisualFlair } from "./theme/flair.js";

export interface RegisterSidebarSurfaceOptions {
  id: string;
  title: string;
  icon: string;
  Component: ComponentType<PluginSurfaceProps>;
  flair?: VisualFlair;
}

/**
 * Registers a sidebar icon and corresponding full-page surface in a single call,
 * automatically injecting `<PluginThemeProvider>` with custom visual flair.
 */
export function registerSidebarSurface(
  plugin: PluginContext,
  options: RegisterSidebarSurfaceOptions,
): void {
  const { id, title, icon, Component, flair } = options;

  const WrappedComponent: ComponentType<PluginSurfaceProps> = (props) => (
    <PluginThemeProvider theme={props.theme} layout={props.layout} flair={flair}>
      <Component {...props} />
    </PluginThemeProvider>
  );

  plugin.addSurface(id, WrappedComponent);
  plugin.addSidebarItem({
    id,
    title,
    icon,
    surface: id,
  });
}

import React, { type ComponentType } from "react";
import type {
  PluginContext,
  PluginWorkspacePanelProps,
  PluginAgentPanelProps,
} from "@getpaseo/plugin";
import { PluginThemeProvider } from "./theme/provider.js";
import type { VisualFlair } from "./theme/flair.js";

export interface RegisterWorkspacePanelOptions {
  id: string;
  title: string;
  icon: string;
  Component: ComponentType<PluginWorkspacePanelProps>;
  flair?: VisualFlair;
}

export interface RegisterAgentPanelOptions {
  id: string;
  title: string;
  icon: string;
  Component: ComponentType<PluginAgentPanelProps>;
  flair?: VisualFlair;
}

/**
 * Registers a workspace-scoped panel with automatic `<PluginThemeProvider>` injection.
 */
export function registerWorkspacePanel(
  plugin: PluginContext,
  options: RegisterWorkspacePanelOptions,
): void {
  const { id, title, icon, Component, flair } = options;

  const WrappedComponent: ComponentType<PluginWorkspacePanelProps> = (props) => (
    <PluginThemeProvider theme={props.theme} layout={props.layout} flair={flair}>
      <Component {...props} />
    </PluginThemeProvider>
  );

  plugin.addWorkspacePanel({
    id,
    title,
    icon,
    context: "workspace",
    Component: WrappedComponent,
  });
}

/**
 * Registers an agent-scoped panel with automatic `<PluginThemeProvider>` injection.
 */
export function registerAgentPanel(
  plugin: PluginContext,
  options: RegisterAgentPanelOptions,
): void {
  const { id, title, icon, Component, flair } = options;

  const WrappedComponent: ComponentType<PluginAgentPanelProps> = (props) => (
    <PluginThemeProvider theme={props.theme} layout={props.layout} flair={flair}>
      <Component {...props} />
    </PluginThemeProvider>
  );

  plugin.addWorkspacePanel({
    id,
    title,
    icon,
    context: "agent",
    Component: WrappedComponent,
  });
}

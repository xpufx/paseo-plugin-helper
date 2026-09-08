import { ComponentType, ReactNode } from 'react';

/**
 * Structural host types for Paseo client integration.
 *
 * These interfaces describe the shapes `paseo-plugin-helper/client` needs
 * from the Paseo host app. They are intentionally decoupled from any
 * Paseo SDK version: this module (and every client module built on
 * it) contains zero Paseo SDK imports, so a single published helper
 * bundle satisfies both the Paseo v0.7 SDK entry points and the Paseo
 * v0.8 runtime-owned entry points.
 *
 * The plugin author provides the real host implementations once, in the
 * client entry, using whichever specifiers match their installed SDK.
 * See docs/client.md for the per-version import paths.
 */
interface HostThemeColors {
    surface0: string;
    surface1: string;
    surface2: string;
    border: string;
    foreground: string;
    foregroundMuted: string;
    accent: string;
    accentForeground: string;
    statusSuccess: string;
    statusWarning: string;
    statusDanger: string;
}
interface HostTheme {
    colors: HostThemeColors;
}
interface HostLayout {
    compact: boolean;
    platform: "ios" | "android" | "web";
    width?: number;
    height?: number;
}
interface HostIconProps {
    name: string;
    size?: number;
    color?: string;
}
type HostIcon = ComponentType<HostIconProps>;
interface HostModalContentProps {
    children: ReactNode;
}
interface HostModalProps {
    title: string;
    icon?: ReactNode;
    open: boolean;
    onOpenChange(open: boolean): void;
    children: ReactNode;
}
type HostModal = ComponentType<HostModalProps> & {
    Content: ComponentType<HostModalContentProps>;
};
interface HostToast {
    show?: (message: string, options?: any) => void;
    copied?: (label?: string) => void;
    error?: (message: string) => void;
}
type HostUseToast = () => HostToast;
interface HostRpcContract {
    name: string;
}
type HostUseRpc = (contract: any) => (input: any) => Promise<any>;
interface HostAgentRef {
    id: string;
    workspaceId?: string | null;
}
type HostAgentUpdate = {
    kind: "remove";
    agentId: string;
} | {
    kind: string;
    agent: HostAgentRef;
};
interface HostAgentsApi {
    subscribe(cb: (update: HostAgentUpdate) => void): () => void;
    list(): Promise<{
        entries: Array<{
            agent: HostAgentRef;
        }>;
    }>;
}
type PluginCleanup = () => void;
interface ClientHostDeps {
    Icon: HostIcon;
    Modal: HostModal;
    useRpc: HostUseRpc;
    useToast: HostUseToast;
}
declare function initClientHelpers(host: ClientHostDeps): void;
declare function getClientHost(): ClientHostDeps;
interface HostPillProps {
    agentId: string;
    workspaceId: string;
    theme: HostTheme;
    layout: HostLayout;
    host: {
        id: string;
        label: string;
    };
}
interface HostWorkspacePanelProps {
    context: "workspace";
    workspaceId: string;
    theme: HostTheme;
    layout: HostLayout;
}
interface HostAgentPanelProps {
    context: "agent";
    workspaceId: string;
    agentId: string;
    theme: HostTheme;
    layout: HostLayout;
}
interface HostSurfaceProps {
    theme: HostTheme;
    layout: HostLayout;
}
interface ComposerPillContribution {
    id: string;
    title: string;
    workspaceId: string;
    agentId: string;
    Component: ComponentType<HostPillProps>;
    onPress(): void | Promise<void>;
}
interface ComposerPillRegistrar {
    addComposerPill(contribution: ComposerPillContribution): PluginCleanup;
    paseo: {
        agents: HostAgentsApi;
    };
}
declare function isClientHostInitialized(): boolean;

export { type ComposerPillContribution as C, type HostAgentRef as H, type PluginCleanup as P, type HostSurfaceProps as a, type HostAgentUpdate as b, type HostLayout as c, type HostPillProps as d, type ComposerPillRegistrar as e, type HostAgentPanelProps as f, type HostWorkspacePanelProps as g, type HostToast as h, type HostIconProps as i, type ClientHostDeps as j, type HostAgentsApi as k, type HostIcon as l, type HostModal as m, type HostModalContentProps as n, type HostModalProps as o, type HostRpcContract as p, type HostTheme as q, type HostThemeColors as r, type HostUseRpc as s, type HostUseToast as t, getClientHost as u, initClientHelpers as v, isClientHostInitialized as w };

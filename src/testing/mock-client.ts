import type {
  PluginClientContext,
  PluginCleanup,
  PluginComposerPillContribution,
  PluginSurfaceProps,
} from "@getpaseo/plugin";
import type { PaseoAgent, PaseoAgentUpdate, PaseoAgentListResult } from "@getpaseo/client";
import type { ComponentType } from "react";

export interface MockClientContext extends PluginClientContext {
  registeredPills: PluginComposerPillContribution[];
  registeredSurfaces: Array<{ id: string; Component: ComponentType<PluginSurfaceProps> }>;
  simulateAgentAdded: (agent: Partial<PaseoAgent> & { id: string; workspaceId: string }) => void;
  simulateAgentRemoved: (agentId: string) => void;
}

/**
 * Creates a fully functional mock PluginClientContext for testing client plugin contributions.
 */
export function createMockClientContext(): MockClientContext {
  const registeredPills: PluginComposerPillContribution[] = [];
  const registeredSurfaces: Array<{ id: string; Component: ComponentType<PluginSurfaceProps> }> = [];
  const agentSubscribers = new Set<(update: PaseoAgentUpdate) => void>();
  const agents = new Map<string, PaseoAgent>();

  const mock: MockClientContext = {
    registeredPills,
    registeredSurfaces,

    addComposerPill(contribution: PluginComposerPillContribution): PluginCleanup {
      registeredPills.push(contribution);
      return () => {
        const index = registeredPills.indexOf(contribution);
        if (index >= 0) registeredPills.splice(index, 1);
      };
    },

    openPanel: () => {},

    rpc: async () => ({} as any),

    openSurface: () => {},

    paseo: {
      workspaces: {} as any,
      projects: {} as any,
      providers: {} as any,
      config: {} as any,
      agents: {
        list: async (): Promise<PaseoAgentListResult> => ({
          requestId: "mock-list-req",
          subscriptionId: null,
          entries: Array.from(agents.values()).map((agent) => ({
            agent,
            project: {
              id: "mock-project",
              title: "Mock Project",
              rootPath: "/mock",
            } as any,
          })),
          pageInfo: {
            nextCursor: null,
            prevCursor: null,
            hasMore: false,
          },
        }),
        ref: () => ({} as any),
        create: async () => ({} as any),
        subscribe: (cb: (update: PaseoAgentUpdate) => void) => {
          agentSubscribers.add(cb);
          return () => {
            agentSubscribers.delete(cb);
          };
        },
      },
    },

    simulateAgentAdded(agentData) {
      const snapshot: PaseoAgent = {
        provider: "mock-provider",
        cwd: "/workspace",
        model: "mock-model",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUserMessageAt: null,
        status: "idle",
        ...agentData,
      } as PaseoAgent;

      agents.set(snapshot.id, snapshot);
      for (const subscriber of agentSubscribers) {
        subscriber({ kind: "upsert", agent: snapshot });
      }
    },

    simulateAgentRemoved(agentId: string) {
      agents.delete(agentId);
      for (const subscriber of agentSubscribers) {
        subscriber({ kind: "remove", agentId });
      }
    },
  };

  return mock;
}

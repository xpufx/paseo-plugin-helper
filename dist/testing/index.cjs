'use strict';

// src/testing/mock-client.ts
function createMockClientContext() {
  const registeredPills = [];
  const registeredSurfaces = [];
  const agentSubscribers = /* @__PURE__ */ new Set();
  const agents = /* @__PURE__ */ new Map();
  const mock = {
    registeredPills,
    registeredSurfaces,
    addComposerPill(contribution) {
      registeredPills.push(contribution);
      return () => {
        const index = registeredPills.indexOf(contribution);
        if (index >= 0) registeredPills.splice(index, 1);
      };
    },
    openPanel: () => {
    },
    rpc: async () => ({}),
    openSurface: () => {
    },
    openSettings: () => {
    },
    addSettingsScreen: () => () => {
    },
    addSurface: () => () => {
    },
    addSidebarItem: () => () => {
    },
    addWorkspacePanel: () => () => {
    },
    addCommandCenterItem: () => () => {
    },
    addSlashCommand: () => () => {
    },
    addAttachmentSource: () => () => {
    },
    addTheme: () => () => {
    },
    addTimelineTransformer: () => () => {
    },
    addTimelineRenderer: () => () => {
    },
    paseo: {
      workspaces: {},
      projects: {},
      providers: {},
      config: {},
      terminals: {},
      agents: {
        list: async () => ({
          requestId: "mock-list-req",
          subscriptionId: null,
          entries: Array.from(agents.values()).map((agent) => ({
            agent,
            project: {
              id: "mock-project",
              title: "Mock Project",
              rootPath: "/mock"
            }
          })),
          pageInfo: {
            nextCursor: null,
            prevCursor: null,
            hasMore: false
          }
        }),
        ref: () => ({}),
        create: async () => ({}),
        subscribe: (cb) => {
          agentSubscribers.add(cb);
          return () => {
            agentSubscribers.delete(cb);
          };
        }
      }
    },
    simulateAgentAdded(agentData) {
      const snapshot = {
        provider: "mock-provider",
        cwd: "/workspace",
        model: "mock-model",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastUserMessageAt: null,
        status: "idle",
        ...agentData
      };
      agents.set(snapshot.id, snapshot);
      for (const subscriber of agentSubscribers) {
        subscriber({ kind: "upsert", agent: snapshot });
      }
    },
    simulateAgentRemoved(agentId) {
      agents.delete(agentId);
      for (const subscriber of agentSubscribers) {
        subscriber({ kind: "remove", agentId });
      }
    }
  };
  return mock;
}

// src/testing/mock-server.ts
function createMockServerContext() {
  const handlers = /* @__PURE__ */ new Map();
  const mock = {
    handlers,
    handle(contract, handler) {
      handlers.set(contract.name, handler);
    },
    registerSettings() {
    },
    registerProvider() {
    },
    on: () => () => {
    },
    before: () => () => {
    },
    async callRpc(contract, input) {
      const handler = handlers.get(contract.name);
      if (!handler) {
        throw new Error(`RPC handler for contract "${contract.name}" was not registered.`);
      }
      return handler(input, { paseo: {} });
    }
  };
  return mock;
}

exports.createMockClientContext = createMockClientContext;
exports.createMockServerContext = createMockServerContext;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map
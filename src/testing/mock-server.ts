import type { PluginContext, PluginRpcContract } from "@getpaseo/plugin";
import type { RpcInput, RpcOutput } from "../shared/rpc.js";

export type MockRpcHandler = (input: any, context: any) => Promise<any> | any;

export interface MockServerContext extends PluginContext {
  handlers: Map<string, MockRpcHandler>;
  callRpc: <TContract extends PluginRpcContract<any, any>>(
    contract: TContract,
    input: RpcInput<TContract>,
  ) => Promise<RpcOutput<TContract>>;
}

/**
 * Creates a mock PluginContext for testing server RPC handlers and plugin contributions.
 */
export function createMockServerContext(): MockServerContext {
  const handlers = new Map<string, MockRpcHandler>();

  const mock: MockServerContext = {
    handlers,

    handle(contract, handler) {
      handlers.set(contract.name, handler as MockRpcHandler);
    },

    addSurface() {},
    addSidebarItem() {},
    addWorkspacePanel() {},
    addCommandCenterItem() {},
    addClientSide() {},
    addAttachmentSource() {},
    addTheme() {},
    addTimelineTransformer() {},
    addTimelineRenderer() {},

    async callRpc(contract, input) {
      const handler = handlers.get(contract.name);
      if (!handler) {
        throw new Error(`RPC handler for contract "${contract.name}" was not registered.`);
      }
      return handler(input, { paseo: {} as any });
    },
  };

  return mock;
}

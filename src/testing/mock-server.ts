import type { PluginServerContext } from "@getpaseo/plugin/server";
import type { PluginRpcContract } from "@getpaseo/plugin";
import type { RpcInput, RpcOutput } from "../shared/rpc.js";

export type MockRpcHandler = (input: any, context: any) => Promise<any> | any;

export interface MockServerContext extends PluginServerContext {
  handlers: Map<string, MockRpcHandler>;
  callRpc: <TContract extends PluginRpcContract<any, any>>(
    contract: TContract,
    input: RpcInput<TContract>,
  ) => Promise<RpcOutput<TContract>>;
}

/**
 * Creates a mock PluginServerContext for testing server RPC handlers and plugin contributions.
 */
export function createMockServerContext(): MockServerContext {
  const handlers = new Map<string, MockRpcHandler>();

  const mock: MockServerContext = {
    handlers,

    handle(contract, handler) {
      handlers.set(contract.name, handler as MockRpcHandler);
    },

    registerSettings() {},
    registerProvider() {},
    on: () => () => {},
    before: () => () => {},

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

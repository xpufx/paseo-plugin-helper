import { PluginClientContext, PluginComposerPillContribution, PluginSurfaceProps, PluginContext, PluginRpcContract } from '@getpaseo/plugin';
import { PaseoAgent } from '@getpaseo/client';
import { ComponentType } from 'react';
import { R as RpcInput, a as RpcOutput } from '../rpc-Ja20I4uK.js';
import 'zod';

interface MockClientContext extends PluginClientContext {
    registeredPills: PluginComposerPillContribution[];
    registeredSurfaces: Array<{
        id: string;
        Component: ComponentType<PluginSurfaceProps>;
    }>;
    simulateAgentAdded: (agent: Partial<PaseoAgent> & {
        id: string;
        workspaceId: string;
    }) => void;
    simulateAgentRemoved: (agentId: string) => void;
}
/**
 * Creates a fully functional mock PluginClientContext for testing client plugin contributions.
 */
declare function createMockClientContext(): MockClientContext;

type MockRpcHandler = (input: any, context: any) => Promise<any> | any;
interface MockServerContext extends PluginContext {
    handlers: Map<string, MockRpcHandler>;
    callRpc: <TContract extends PluginRpcContract<any, any>>(contract: TContract, input: RpcInput<TContract>) => Promise<RpcOutput<TContract>>;
}
/**
 * Creates a mock PluginContext for testing server RPC handlers and plugin contributions.
 */
declare function createMockServerContext(): MockServerContext;

export { type MockClientContext, type MockRpcHandler, type MockServerContext, createMockClientContext, createMockServerContext };

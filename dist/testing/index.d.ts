import { PluginClientContext, PluginComposerPillContribution, PluginSurfaceProps } from '@getpaseo/plugin/client';
import { PaseoAgent } from '@getpaseo/client';
import { ComponentType } from 'react';
import { PluginServerContext } from '@getpaseo/plugin/server';
import { PluginRpcContract } from '@getpaseo/plugin';
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
interface MockServerContext extends PluginServerContext {
    handlers: Map<string, MockRpcHandler>;
    callRpc: <TContract extends PluginRpcContract<any, any>>(contract: TContract, input: RpcInput<TContract>) => Promise<RpcOutput<TContract>>;
}
/**
 * Creates a mock PluginServerContext for testing server RPC handlers and plugin contributions.
 */
declare function createMockServerContext(): MockServerContext;

export { type MockClientContext, type MockRpcHandler, type MockServerContext, createMockClientContext, createMockServerContext };

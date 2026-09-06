import { PluginRpcContract } from '@getpaseo/plugin';
import { input, output, ZodType } from 'zod';

type RpcInput<TContract> = TContract extends PluginRpcContract<infer TInput, any> ? input<TInput> : unknown;
type RpcOutput<TContract> = TContract extends PluginRpcContract<any, infer TOutput> ? output<TOutput> : unknown;
interface DefineRpcOptions<TName extends string = string, TInput extends ZodType = ZodType, TOutput extends ZodType = ZodType> {
    name: TName;
    input: TInput;
    output: TOutput;
    description?: string;
}
/**
 * Enhanced helper for defining a typed Paseo RPC contract with optional description.
 */
declare function defineContract<TName extends string, TInput extends ZodType, TOutput extends ZodType>(options: DefineRpcOptions<TName, TInput, TOutput>): PluginRpcContract<TInput, TOutput> & {
    readonly description?: string;
};

export { type DefineRpcOptions as D, type RpcInput as R, type RpcOutput as a, defineContract as d };

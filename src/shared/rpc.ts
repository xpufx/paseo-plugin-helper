import { defineRpc, type PluginRpcContract } from "@getpaseo/plugin";
import type { ZodType, input as ZodInput, output as ZodOutput } from "zod";

export { defineRpc, type PluginRpcContract };

export type RpcInput<TContract> = TContract extends PluginRpcContract<infer TInput, any>
  ? ZodInput<TInput>
  : unknown;

export type RpcOutput<TContract> = TContract extends PluginRpcContract<any, infer TOutput>
  ? ZodOutput<TOutput>
  : unknown;

export interface DefineRpcOptions<
  TName extends string = string,
  TInput extends ZodType = ZodType,
  TOutput extends ZodType = ZodType,
> {
  name: TName;
  input: TInput;
  output: TOutput;
  description?: string;
}

/**
 * Enhanced helper for defining a typed Paseo RPC contract with optional description.
 */
export function defineContract<
  TName extends string,
  TInput extends ZodType,
  TOutput extends ZodType,
>(
  options: DefineRpcOptions<TName, TInput, TOutput>,
): PluginRpcContract<TInput, TOutput> & { readonly description?: string } {
  const contract = defineRpc({
    name: options.name,
    input: options.input,
    output: options.output,
  });

  if (options.description) {
    Object.defineProperty(contract, "description", {
      value: options.description,
      enumerable: true,
      writable: false,
    });
  }

  return contract as PluginRpcContract<TInput, TOutput> & { readonly description?: string };
}

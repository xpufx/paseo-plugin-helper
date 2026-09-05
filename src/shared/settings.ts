import { z, type ZodType } from "zod";
import { defineContract, type PluginRpcContract } from "./rpc.js";

export const SettingsEmptyInputSchema = z
  .union([z.void(), z.record(z.string(), z.unknown())])
  .optional();
export type SettingsEmptyInput = z.infer<typeof SettingsEmptyInputSchema>;

export interface SettingsContract<TSettings extends Record<string, any>> {
  readonly name: string;
  readonly schema: ZodType<TSettings>;
  readonly defaultSettings: TSettings;
  readonly get: PluginRpcContract<ZodType<SettingsEmptyInput>, ZodType<TSettings>>;
  readonly update: PluginRpcContract<ZodType<Partial<TSettings>>, ZodType<TSettings>>;
  readonly reset: PluginRpcContract<ZodType<SettingsEmptyInput>, ZodType<TSettings>>;
}

export interface DefineSettingsContractOptions<TSettings extends Record<string, any>> {
  /**
   * Unique name for the settings domain (e.g. "top.settings" or "myplugin.config").
   * Automatically normalizes invalid RPC characters.
   */
  name: string;
  /**
   * Zod Object schema representing the full settings shape.
   * Use `.default(...)` on fields to provide default values.
   */
  schema: ZodType<TSettings> & { partial?: () => ZodType<Partial<TSettings>> };
  /**
   * Optional default data override if schema fields do not all specify `.default()`.
   */
  defaultData?: Partial<TSettings>;
  /**
   * Optional human-readable description of the settings.
   */
  description?: string;
}

/**
 * Defines a pair of typed Paseo RPC contracts (get, update, reset) for plugin settings.
 */
export function defineSettingsContract<TSettings extends Record<string, any>>(
  options: DefineSettingsContractOptions<TSettings>,
): SettingsContract<TSettings> {
  const { name, schema, defaultData, description } = options;

  let computedDefaults: TSettings;
  try {
    computedDefaults = schema.parse(defaultData ?? {}) as TSettings;
  } catch {
    computedDefaults = (defaultData ?? {}) as TSettings;
  }

  const sanitizedName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_");

  const partialSchema =
    typeof schema.partial === "function"
      ? (schema.partial() as ZodType<Partial<TSettings>>)
      : (z.record(z.string(), z.unknown()) as unknown as ZodType<Partial<TSettings>>);

  const getContract = defineContract({
    name: `${sanitizedName}.get`,
    input: SettingsEmptyInputSchema as ZodType<SettingsEmptyInput>,
    output: schema,
    description: description ? `Get ${description}` : `Get ${name} settings`,
  });

  const updateContract = defineContract({
    name: `${sanitizedName}.update`,
    input: partialSchema,
    output: schema,
    description: description ? `Update ${description}` : `Update ${name} settings`,
  });

  const resetContract = defineContract({
    name: `${sanitizedName}.reset`,
    input: SettingsEmptyInputSchema as ZodType<SettingsEmptyInput>,
    output: schema,
    description: description ? `Reset ${description}` : `Reset ${name} settings to defaults`,
  });

  return {
    name: sanitizedName,
    schema,
    defaultSettings: computedDefaults,
    get: getContract,
    update: updateContract,
    reset: resetContract,
  };
}

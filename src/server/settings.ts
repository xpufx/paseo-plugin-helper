import type { PluginContext } from "@getpaseo/plugin";
import type { SettingsContract } from "../shared/settings.js";
import type { PluginStorage } from "./storage.js";

export interface RegisterSettingsRpcOptions<TSettings> {
  /**
   * Optional callback invoked whenever settings are updated.
   */
  onUpdate?: (newSettings: TSettings, prevSettings: TSettings) => void | Promise<void>;
  /**
   * Optional callback invoked whenever settings are reset.
   */
  onReset?: (defaultSettings: TSettings, prevSettings: TSettings) => void | Promise<void>;
}

/**
 * Registers RPC handlers on the daemon PluginContext for a SettingsContract.
 * Connects get, update, and reset RPCs directly to atomic PluginStorage persistence.
 */
export function registerSettingsRpc<TSettings extends Record<string, any>>(
  context: PluginContext,
  contract: SettingsContract<TSettings>,
  storage: PluginStorage<TSettings>,
  options: RegisterSettingsRpcOptions<TSettings> = {},
): void {
  // Register GET handler
  context.handle(contract.get, async () => {
    return storage.readAsync();
  });

  // Register UPDATE handler
  context.handle(contract.update, async (input) => {
    const prev = await storage.readAsync();
    const updated = await storage.updateAsync((current) => {
      return { ...current, ...(input as Partial<TSettings>) };
    });
    if (options.onUpdate) {
      await options.onUpdate(updated, prev);
    }
    return updated;
  });

  // Register RESET handler
  context.handle(contract.reset, async () => {
    const prev = await storage.readAsync();
    storage.reset();
    const fresh = await storage.readAsync();
    if (options.onReset) {
      await options.onReset(fresh, prev);
    }
    return fresh;
  });
}

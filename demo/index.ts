import type { PluginContext } from "@getpaseo/plugin";
import { getDemoDataRpc, triggerDemoActionRpc } from "./demo.shared.js";
import {
  handleGetDemoData,
  handleTriggerDemoAction,
  backgroundWorker,
  log,
} from "./demo.server.js";
import { contributeClient } from "./pill.client.js";

export default function contribute(plugin: PluginContext) {
  plugin.handle(getDemoDataRpc, handleGetDemoData);
  plugin.handle(triggerDemoActionRpc, handleTriggerDemoAction);
  plugin.addClientSide(contributeClient);

  return () => {
    backgroundWorker.stop();
    log.info("Helper demo plugin cleaned up cleanly");
  };
}

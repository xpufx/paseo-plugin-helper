import type { PluginClientContext } from "@getpaseo/plugin";
import { contributeClient } from "./client/pill.js";

export default function contribute(client: PluginClientContext) {
  return contributeClient(client);
}

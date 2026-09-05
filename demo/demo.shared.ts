import { defineContract, type RpcOutput } from "paseo-plugin-helper/shared";
import { z } from "zod";

export const getDemoDataRpc = defineContract({
  name: "helper-demo.get-data",
  description: "Get comprehensive demo metrics, hardware stats, and service items",
  input: z.object({}),
  output: z.object({
    version: z.string(),
    hostname: z.string(),
    platform: z.string(),
    cpuModel: z.string(),
    cpuUsagePercent: z.number(),
    memoryUsedPercent: z.number(),
    memoryUsedBytes: z.number(),
    memoryTotalBytes: z.number(),
    loadAvg: z.array(z.number()),
    uptimeSeconds: z.number(),
    daemonPort: z.number(),
    backgroundTicks: z.number(),
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        status: z.enum(["running", "idle", "syncing", "warning"]),
        loadPercent: z.number(),
      })
    ),
  }),
});

export const triggerDemoActionRpc = defineContract({
  name: "helper-demo.trigger-action",
  description: "Trigger an RPC action on the daemon",
  input: z.object({
    actionName: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
});

export type DemoData = RpcOutput<typeof getDemoDataRpc>;

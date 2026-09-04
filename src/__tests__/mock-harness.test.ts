import { describe, it, expect } from "vitest";
import { createMockClientContext } from "../testing/mock-client.js";
import { createMockServerContext } from "../testing/mock-server.js";
import { defineContract } from "../shared/rpc.js";
import { z } from "zod";

describe("Testing Mock Harness", () => {
  it("simulates client agent additions and removals", async () => {
    const client = createMockClientContext();
    const seenUpdates: string[] = [];

    client.paseo.agents.subscribe((update) => {
      if (update.kind === "upsert") {
        seenUpdates.push(`added:${update.agent.id}`);
      } else {
        seenUpdates.push(`removed:${update.agentId}`);
      }
    });

    client.simulateAgentAdded({ id: "agent-1", workspaceId: "ws-1" });
    client.simulateAgentAdded({ id: "agent-2", workspaceId: "ws-1" });
    client.simulateAgentRemoved("agent-1");

    expect(seenUpdates).toEqual(["added:agent-1", "added:agent-2", "removed:agent-1"]);

    const list = await client.paseo.agents.list();
    expect(list.entries).toHaveLength(1);
    expect(list.entries[0].agent.id).toBe("agent-2");
  });

  it("registers and calls RPC handlers on mock server context", async () => {
    const server = createMockServerContext();

    const echoContract = defineContract({
      name: "echo",
      input: z.object({ msg: z.string() }),
      output: z.object({ reply: z.string() }),
    });

    server.handle(echoContract, (input) => ({
      reply: `Echo: ${input.msg}`,
    }));

    const response = await server.callRpc(echoContract, { msg: "Hello Paseo" });
    expect(response.reply).toBe("Echo: Hello Paseo");
  });
});

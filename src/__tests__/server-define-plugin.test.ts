import { describe, it, expect, vi } from "vitest";
import { definePluginServer } from "../server/define-plugin.js";
import { createMockServerContext } from "../testing/mock-server.js";

describe("definePluginServer", () => {
  it("automatically emits startup banner and passes log to setup", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    let receivedLog: any = null;
    const pluginEntry = definePluginServer({
      name: "top",
      version: "0.1.0",
      setup(plugin, { log }) {
        receivedLog = log;
        log.info("System poller online");
        return () => {};
      },
    });

    const mockServer = createMockServerContext();
    const cleanup = pluginEntry(mockServer as any);

    expect(logSpy).toHaveBeenCalled();
    // Check banner was emitted
    const banner = logSpy.mock.calls[0][0];
    expect(banner).toContain("[top v0.1.0] Initializing plugin");

    // Check log call worked
    expect(receivedLog).toBeDefined();
    const infoCall = logSpy.mock.calls[1][0];
    expect(infoCall).toContain("[top v0.1.0] [INFO] System poller online");

    cleanup();
    logSpy.mockRestore();
  });

  it("can opt out of banner and logging via logging: false", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const pluginEntry = definePluginServer({
      name: "top",
      logging: false,
      setup(plugin, { log }) {
        log.info("This should be suppressed");
        return () => {};
      },
    });

    const mockServer = createMockServerContext();
    const cleanup = pluginEntry(mockServer as any);

    expect(logSpy).not.toHaveBeenCalled();

    cleanup();
    logSpy.mockRestore();
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  CustomPillDefinitionSchema,
  parseNumericPillValue,
  resolveCustomPillStatus,
  formatPillDisplay,
} from "../shared/custom-pills.js";
import {
  discoverCustomPillConfigs,
  CustomPillPoller,
} from "../server/custom-pills.js";

describe("Custom Pills - Shared Logic", () => {
  it("validates full and minimal pill definitions", () => {
    const valid = CustomPillDefinitionSchema.safeParse({
      id: "gpu",
      title: "GPU Util",
      command: "echo 42",
      intervalMs: 3000,
      thresholds: {
        warning: 70,
        danger: 90,
      },
    });
    expect(valid.success).toBe(true);

    const invalid = CustomPillDefinitionSchema.safeParse({
      id: "",
      title: "",
      command: "",
    });
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("extracts numeric values from raw strings", () => {
    expect(parseNumericPillValue("42%")).toBe(42);
    expect(parseNumericPillValue("CPU: 98.6%")).toBe(98.6);
    expect(parseNumericPillValue("-15.4 deg")).toBe(-15.4);
    expect(parseNumericPillValue("no numbers here")).toBeUndefined();
  });

  it("resolves status variants according to thresholds", () => {
    const normalThresholds = { warning: 70, danger: 90 };
    expect(resolveCustomPillStatus(50, normalThresholds)).toBe("neutral");
    expect(resolveCustomPillStatus(70, normalThresholds)).toBe("warning");
    expect(resolveCustomPillStatus(85, normalThresholds)).toBe("warning");
    expect(resolveCustomPillStatus(90, normalThresholds)).toBe("danger");
    expect(resolveCustomPillStatus(95, normalThresholds)).toBe("danger");

    // Inverted thresholds (lower is worse, e.g. battery)
    const invertedThresholds = { warning: 20, danger: 10, invert: true };
    expect(resolveCustomPillStatus(50, invertedThresholds)).toBe("success");
    expect(resolveCustomPillStatus(20, invertedThresholds)).toBe("warning");
    expect(resolveCustomPillStatus(15, invertedThresholds)).toBe("warning");
    expect(resolveCustomPillStatus(10, invertedThresholds)).toBe("danger");
    expect(resolveCustomPillStatus(5, invertedThresholds)).toBe("danger");
  });

  it("formats display strings with prefix and suffix", () => {
    expect(formatPillDisplay("42", undefined, "%")).toBe("42%");
    expect(formatPillDisplay(" 120 ", "$", "/mo")).toBe("$120/mo");
  });
});

describe("Custom Pills - Server Discovery & Poller", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paseo-test-pills-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("discovers .json and .jsonc pill configs with comments", async () => {
    fs.writeFileSync(
      path.join(tempDir, "pill1.json"),
      JSON.stringify({
        id: "test1",
        title: "Test 1",
        command: "echo 10",
      }),
    );

    fs.writeFileSync(
      path.join(tempDir, "pill2.jsonc"),
      `// Custom GPU pill\n{\n  "id": "test2",\n  "title": "Test 2",\n  /* command */ "command": "echo 20"\n}\n`,
    );

    const configs = await discoverCustomPillConfigs(tempDir);
    expect(configs).toHaveLength(2);
    expect(configs.map((c) => c.id).sort()).toEqual(["test1", "test2"]);
    expect(configs.find((c) => c.id === "test1")).toMatchObject({
      sourceFile: path.join(tempDir, "pill1.json"),
    });
    expect(configs.find((c) => c.id === "test2")).toMatchObject({
      sourceFile: path.join(tempDir, "pill2.jsonc"),
    });
  });

  it("polls commands, computes state, and executes modal commands", async () => {
    const poller = new CustomPillPoller({
      pills: [
        {
          id: "count",
          title: "Items",
          command: "echo 75",
          suffix: " items",
          intervalMs: 10000,
          timeoutMs: 5000,
          enabled: true,
          thresholds: {
            warning: 70,
            danger: 90,
          },
          modal: {
            title: "Item Details",
            command: "echo 'Detailed breakdown of items'",
            preformatted: true,
          },
        },
      ],
    });

    const state = await poller.pollPill("count");
    expect(state).toBeDefined();
    expect(state?.rawValue).toBe("75");
    expect(state?.displayValue).toBe("75 items");
    expect(state?.numericValue).toBe(75);
    expect(state?.status).toBe("warning");
    expect(state?.sourceFile).toBeUndefined();

    const modalRes = await poller.runModalCommand("count");
    expect(modalRes.output).toContain("Detailed breakdown of items");

    const updatedState = poller.getState("count");
    expect(updatedState?.modalOutput).toContain("Detailed breakdown of items");

    poller.stop();
  });
});

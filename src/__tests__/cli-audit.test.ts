import { describe, it, expect } from "vitest";
import { auditProject } from "../cli/scanner.js";
import { formatReportPretty, formatReportJson } from "../cli/formatter.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("Audit CLI & Scanner", () => {
  it("detects bespoke patterns in sample plugin files", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "paseo-audit-test-"));

    try {
      // 1. Write bespoke client file with raw agent subscription
      fs.writeFileSync(
        path.join(tmpDir, "pill.client.tsx"),
        `
        export function contributeClient(client) {
          client.paseo.agents.subscribe((update) => {});
          client.addComposerPill({ id: "test", title: "Test" });
        }
        `,
      );

      // 2. Write bespoke server file with raw file persistence and console.log
      fs.writeFileSync(
        path.join(tmpDir, "resources.server.ts"),
        `
        import fs from "node:fs";
        export function saveStatus(status) {
          console.log("Saving status", status);
          fs.writeFileSync("~/.paseo/status.json", JSON.stringify(status));
        }
        `,
      );

      // 3. Write bespoke version reading
      fs.writeFileSync(
        path.join(tmpDir, "index.ts"),
        `
        import fs from "node:fs";
        const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
        console.log(pkg.version);
        `,
      );

      const report = auditProject(tmpDir);

      expect(report.scannedFiles).toBe(3);
      expect(report.issues.length).toBeGreaterThanOrEqual(3);

      const ruleIds = report.issues.map((i) => i.ruleId);
      expect(ruleIds).toContain("no-manual-agent-subscription");
      expect(ruleIds).toContain("no-raw-file-persistence");
      expect(ruleIds).toContain("no-raw-console-in-server");

      const pretty = formatReportPretty(report);
      expect(pretty).toContain("no-manual-agent-subscription");
      expect(pretty).toContain("Audit Summary:");

      const json = JSON.parse(formatReportJson(report));
      expect(json.scannedFiles).toBe(3);
      expect(json.issues.length).toBe(report.issues.length);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("passes clean projects with helper imports", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "paseo-audit-clean-"));

    try {
      fs.writeFileSync(
        path.join(tmpDir, "pill.client.tsx"),
        `
        import { registerComposerPill } from "paseo-plugin-helper/client";
        export function contributeClient(client) {
          return registerComposerPill(client, { id: "test", title: "Clean" });
        }
        `,
      );

      fs.writeFileSync(
        path.join(tmpDir, "resources.server.ts"),
        `
        import { createPluginLogger, PluginStorage } from "paseo-plugin-helper/server";
        const log = createPluginLogger("test");
        const storage = new PluginStorage("test", "status.json");
        `,
      );

      const report = auditProject(tmpDir, { strict: true });
      expect(report.scannedFiles).toBe(2);
      expect(report.issues.length).toBe(0);
      expect(report.passed).toBe(true);

      const pretty = formatReportPretty(report);
      expect(pretty).toContain("[PASS]");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

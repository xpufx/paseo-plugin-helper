import fs from "node:fs";
import path from "node:path";
import { AUDIT_RULES } from "./rules.js";
import type { AuditIssue, AuditOptions, AuditReport } from "./types.js";

const DEFAULT_IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".paseo",
  ".agents",
  ".gemini",
  "coverage",
]);

const SCANNABLE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function isTestFile(filePath: string): boolean {
  return (
    filePath.includes("__tests__") ||
    filePath.includes(".test.") ||
    filePath.includes(".spec.") ||
    filePath.endsWith(".d.ts")
  );
}

function isBuildOrToolFile(filePath: string): boolean {
  const base = path.basename(filePath);
  return (
    base.startsWith("tsup.config.") ||
    base.startsWith("vite.config.") ||
    base.startsWith("vitest.config.") ||
    base === "cli.ts" ||
    base === "scanner.ts" ||
    filePath.includes("/scripts/") ||
    filePath.includes("/testing/")
  );
}

function findFiles(dir: string, ignoredCustom: Set<string>): string[] {
  const results: string[] = [];

  function walk(current: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!DEFAULT_IGNORED_DIRS.has(entry.name) && !ignoredCustom.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (SCANNABLE_EXTENSIONS.has(ext) && !entry.name.endsWith(".d.ts")) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return results;
}

export function auditProject(targetDir: string, options: AuditOptions = {}): AuditReport {
  const resolvedTarget = path.resolve(targetDir);
  const ignoredCustom = new Set(options.ignore ?? []);
  const files = findFiles(resolvedTarget, ignoredCustom);
  const issues: AuditIssue[] = [];

  for (const filePath of files) {
    const relPath = path.relative(resolvedTarget, filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    const inTest = isTestFile(relPath);
    const inBuildOrTool = isBuildOrToolFile(relPath);

    // Rule 1: no-manual-agent-subscription
    if (!inTest && !inBuildOrTool) {
      const hasAgentSubscribe = content.includes(".agents.subscribe(");
      const hasAddComposerPill = content.includes(".addComposerPill(");
      const hasRegisterPill = content.includes("registerComposerPill");

      if ((hasAgentSubscribe || hasAddComposerPill) && !hasRegisterPill) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes(".agents.subscribe(") || line.includes(".addComposerPill(")) {
            const rule = AUDIT_RULES["no-manual-agent-subscription"];
            issues.push({
              ruleId: rule.id,
              severity: rule.severity,
              file: relPath,
              line: i + 1,
              column: line.indexOf(line.trim()),
              message: rule.description,
              codeSnippet: line.trim(),
              replacement: rule.replacement,
              docUrl: rule.docUrl,
            });
            break; // 1 report per file is sufficient
          }
        }
      }
    }

    // Rule 2: no-raw-file-persistence
    if (!inTest && !inBuildOrTool) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isFsWrite =
          line.includes("fs.writeFileSync(") ||
          line.includes("fs.writeFile(") ||
          line.includes("fs.promises.writeFile(");

        if (isFsWrite) {
          const isPersistingState =
            line.includes(".json") ||
            line.includes("status") ||
            line.includes("settings") ||
            line.includes("state") ||
            line.includes(".paseo");

          if (isPersistingState && !content.includes("PluginStorage")) {
            const rule = AUDIT_RULES["no-raw-file-persistence"];
            issues.push({
              ruleId: rule.id,
              severity: rule.severity,
              file: relPath,
              line: i + 1,
              column: line.indexOf(line.trim()),
              message: rule.description,
              codeSnippet: line.trim(),
              replacement: rule.replacement,
              docUrl: rule.docUrl,
            });
          }
        }
      }
    }

    // Rule 3: no-raw-console-in-server
    const isServerFile =
      relPath.includes(".server.") ||
      relPath.includes("/server/") ||
      (relPath.includes("index.") && !relPath.includes(".client."));

    if (isServerFile && !inTest && !inBuildOrTool) {
      if (!content.includes("createPluginLogger")) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            (line.includes("console.log(") ||
              line.includes("console.error(") ||
              line.includes("console.warn(")) &&
            !line.trim().startsWith("//")
          ) {
            const rule = AUDIT_RULES["no-raw-console-in-server"];
            issues.push({
              ruleId: rule.id,
              severity: rule.severity,
              file: relPath,
              line: i + 1,
              column: line.indexOf(line.trim()),
              message: rule.description,
              codeSnippet: line.trim(),
              replacement: rule.replacement,
              docUrl: rule.docUrl,
            });
            break; // 1 report per file
          }
        }
      }
    }

    // Rule 4: no-filesystem-plugin-probing
    if (!inTest && !inBuildOrTool) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isProbe =
          (line.includes("plugins") || line.includes("config.json")) &&
          (line.includes("fs.existsSync") ||
            line.includes("fs.stat") ||
            line.includes("fs.readdir") ||
            line.includes("fs.readFileSync"));

        if (
          isProbe &&
          !content.includes("isPluginRunning") &&
          !content.includes("isPluginInstalled") &&
          !content.includes("listPlugins")
        ) {
          const rule = AUDIT_RULES["no-filesystem-plugin-probing"];
          issues.push({
            ruleId: rule.id,
            severity: rule.severity,
            file: relPath,
            line: i + 1,
            column: line.indexOf(line.trim()),
            message: rule.description,
            codeSnippet: line.trim(),
            replacement: rule.replacement,
            docUrl: rule.docUrl,
          });
        }
      }
    }

    // Rule 5: no-manual-mcp-config-mutation
    if (!inTest && !inBuildOrTool) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isMcpConfig =
          line.includes(".claude.json") ||
          line.includes("mcp_config.json") ||
          line.includes("opencode.json");

        if (
          isMcpConfig &&
          (line.includes("writeFile") || line.includes("writeFileSync")) &&
          !content.includes("upsertMcpServer")
        ) {
          const rule = AUDIT_RULES["no-manual-mcp-config-mutation"];
          issues.push({
            ruleId: rule.id,
            severity: rule.severity,
            file: relPath,
            line: i + 1,
            column: line.indexOf(line.trim()),
            message: rule.description,
            codeSnippet: line.trim(),
            replacement: rule.replacement,
            docUrl: rule.docUrl,
          });
        }
      }
    }

    // Rule 6: no-raw-mcp-subprocess
    if (!inTest && !inBuildOrTool) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isMcpSpawn =
          (line.includes("spawn(") || line.includes("exec(")) &&
          (line.includes("mcp") || content.includes("jsonrpc"));

        if (isMcpSpawn && !content.includes("McpClient")) {
          const rule = AUDIT_RULES["no-raw-mcp-subprocess"];
          issues.push({
            ruleId: rule.id,
            severity: rule.severity,
            file: relPath,
            line: i + 1,
            column: line.indexOf(line.trim()),
            message: rule.description,
            codeSnippet: line.trim(),
            replacement: rule.replacement,
            docUrl: rule.docUrl,
          });
        }
      }
    }

    // Rule 7: no-raw-system-metrics
    if (!inTest && !inBuildOrTool && !relPath.includes("system.ts")) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isRawMetric =
          line.includes("os.loadavg()") ||
          line.includes("os.cpus()") ||
          line.includes("/proc/loadavg") ||
          line.includes("/proc/stat");

        if (isRawMetric && !content.includes("getSystemMetrics")) {
          const rule = AUDIT_RULES["no-raw-system-metrics"];
          issues.push({
            ruleId: rule.id,
            severity: rule.severity,
            file: relPath,
            line: i + 1,
            column: line.indexOf(line.trim()),
            message: rule.description,
            codeSnippet: line.trim(),
            replacement: rule.replacement,
            docUrl: rule.docUrl,
          });
          break;
        }
      }
    }

    // Rule 8: no-manual-version-resolution
    if (!inTest && !inBuildOrTool && !relPath.includes("version.ts")) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isVersionProbe =
          line.includes("package.json") &&
          (line.includes(".version") || content.includes("JSON.parse(fs.readFileSync"));

        if (
          isVersionProbe &&
          !content.includes("resolvePluginVersion") &&
          !content.includes("stampVersion")
        ) {
          const rule = AUDIT_RULES["no-manual-version-resolution"];
          issues.push({
            ruleId: rule.id,
            severity: rule.severity,
            file: relPath,
            line: i + 1,
            column: line.indexOf(line.trim()),
            message: rule.description,
            codeSnippet: line.trim(),
            replacement: rule.replacement,
            docUrl: rule.docUrl,
          });
          break;
        }
      }
    }
  }

  const summary = {
    errorCount: issues.filter((i) => i.severity === "error").length,
    warnCount: issues.filter((i) => i.severity === "warn").length,
    infoCount: issues.filter((i) => i.severity === "info").length,
    suggestionCount: issues.filter((i) => i.severity === "suggestion").length,
  };

  const passed = options.strict
    ? summary.errorCount === 0 && summary.warnCount === 0
    : summary.errorCount === 0;

  return {
    targetDir: resolvedTarget,
    scannedFiles: files.length,
    issues,
    summary,
    passed,
  };
}

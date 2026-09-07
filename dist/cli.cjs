#!/usr/bin/env node
'use strict';

var process = require('process');
var fs = require('fs');
var path = require('path');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var process__default = /*#__PURE__*/_interopDefault(process);
var fs__default = /*#__PURE__*/_interopDefault(fs);
var path__default = /*#__PURE__*/_interopDefault(path);

// src/cli/rules.ts
var AUDIT_RULES = {
  "no-manual-agent-subscription": {
    id: "no-manual-agent-subscription",
    severity: "warn",
    description: "Manual Paseo agent subscription and composer pill registration detected.",
    replacement: "registerComposerPill from 'paseo-plugin-helper/client'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/client.md#3-lifecycle-registration-helpers"
  },
  "no-raw-file-persistence": {
    id: "no-raw-file-persistence",
    severity: "warn",
    description: "Direct file write (fs.writeFileSync / fs.writeFile) used for state, status, or configuration persistence.",
    replacement: "PluginStorage from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#3-atomic-state-storage-pluginstorage"
  },
  "no-raw-console-in-server": {
    id: "no-raw-console-in-server",
    severity: "suggestion",
    description: "Raw console logging (console.log / console.error) used in server runtime.",
    replacement: "createPluginLogger from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#1-structured-logging-createpluginlogger"
  },
  "no-filesystem-plugin-probing": {
    id: "no-filesystem-plugin-probing",
    severity: "warn",
    description: "Direct filesystem inspection of ~/.paseo/plugins or config.json to check plugin presence.",
    replacement: "isPluginRunning, isPluginInstalled, or listPlugins from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#12-plugin-query--lifecycle-helpers-listplugins-ispluginrunning-getplugininfo"
  },
  "no-manual-mcp-config-mutation": {
    id: "no-manual-mcp-config-mutation",
    severity: "warn",
    description: "Manual modification or parsing of agent MCP configuration files (Claude, Cursor, Gemini, OpenCode).",
    replacement: "upsertMcpServer / removeMcpServer from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#11-agent-mcp-configuration-writer-upsertmcpserver--removemcpserver"
  },
  "no-raw-mcp-subprocess": {
    id: "no-raw-mcp-subprocess",
    severity: "warn",
    description: "Raw child_process spawn used to launch or communicate with MCP stdio servers.",
    replacement: "McpClient from 'paseo-plugin-helper/mcp'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/mcp.md"
  },
  "no-raw-system-metrics": {
    id: "no-raw-system-metrics",
    severity: "suggestion",
    description: "Direct os module calls (os.loadavg, os.cpus) or /proc reads for host metrics.",
    replacement: "getSystemMetrics / CpuSampler from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#2-system-host-metrics-getsystemmetrics--cpusampler"
  },
  "no-unredacted-secrets": {
    id: "no-unredacted-secrets",
    severity: "warn",
    description: "Sensitive tokens, API keys, or credentials handled or logged without redaction.",
    replacement: "redactSecrets from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#5-secret-redaction-redactsecrets"
  },
  "no-manual-version-resolution": {
    id: "no-manual-version-resolution",
    severity: "suggestion",
    description: "Manual reading and parsing of package.json for plugin version resolution.",
    replacement: "resolvePluginVersion / stampVersion from 'paseo-plugin-helper/server'",
    docUrl: "https://github.com/xpufx/paseo-plugin-helper/blob/main/docs/server.md#6-plugin-version-resolution-resolvepluginversion"
  }
};

// src/cli/scanner.ts
var DEFAULT_IGNORED_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".paseo",
  ".agents",
  ".gemini",
  "coverage"
]);
var SCANNABLE_EXTENSIONS = /* @__PURE__ */ new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
function isTestFile(filePath) {
  return filePath.includes("__tests__") || filePath.includes(".test.") || filePath.includes(".spec.") || filePath.endsWith(".d.ts");
}
function isBuildOrToolFile(filePath) {
  const base = path__default.default.basename(filePath);
  return base.startsWith("tsup.config.") || base.startsWith("vite.config.") || base.startsWith("vitest.config.") || base === "cli.ts" || base === "scanner.ts" || filePath.includes("/scripts/") || filePath.includes("/testing/");
}
function isGeneratedOrBundledFile(filePath) {
  const base = path__default.default.basename(filePath);
  return base.includes(".bundled.") || base.includes(".bundle.") || base.includes(".min.") || base.endsWith(".bundle.js") || base.endsWith(".bundle.mjs");
}
function findFiles(dir, ignoredCustom) {
  const results = [];
  function walk(current) {
    let entries = [];
    try {
      entries = fs__default.default.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path__default.default.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!DEFAULT_IGNORED_DIRS.has(entry.name) && !ignoredCustom.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path__default.default.extname(entry.name);
        if (SCANNABLE_EXTENSIONS.has(ext) && !entry.name.endsWith(".d.ts") && !isGeneratedOrBundledFile(entry.name)) {
          results.push(fullPath);
        }
      }
    }
  }
  walk(dir);
  return results;
}
function auditProject(targetDir, options = {}) {
  const resolvedTarget = path__default.default.resolve(targetDir);
  const ignoredCustom = new Set(options.ignore ?? []);
  const files = findFiles(resolvedTarget, ignoredCustom);
  const issues = [];
  for (const filePath of files) {
    const relPath = path__default.default.relative(resolvedTarget, filePath);
    const content = fs__default.default.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const inTest = isTestFile(relPath);
    const inBuildOrTool = isBuildOrToolFile(relPath);
    if (!inTest && !inBuildOrTool) {
      content.includes(".agents.subscribe(");
      const hasAddComposerPill = content.includes(".addComposerPill(");
      const hasRegisterPill = content.includes("registerComposerPill");
      if (hasAddComposerPill && !hasRegisterPill) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes(".addComposerPill(") || line.includes(".agents.subscribe(")) {
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
              docUrl: rule.docUrl
            });
            break;
          }
        }
      }
    }
    if (!inTest && !inBuildOrTool) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isFsWrite = line.includes("fs.writeFileSync(") || line.includes("fs.writeFile(") || line.includes("fs.promises.writeFile(");
        if (isFsWrite) {
          const isPersistingState = line.includes(".json") || line.includes("status") || line.includes("settings") || line.includes("state") || line.includes(".paseo");
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
              docUrl: rule.docUrl
            });
          }
        }
      }
    }
    const isServerFile = relPath.includes(".server.") || relPath.includes("/server/") || relPath.includes("index.") && !relPath.includes(".client.");
    if (isServerFile && !inTest && !inBuildOrTool) {
      if (!content.includes("createPluginLogger")) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if ((line.includes("console.log(") || line.includes("console.error(") || line.includes("console.warn(")) && !line.trim().startsWith("//")) {
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
              docUrl: rule.docUrl
            });
            break;
          }
        }
      }
    }
    if (!inTest && !inBuildOrTool) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isProbe = (line.includes("plugins") || line.includes("config.json")) && (line.includes("fs.existsSync") || line.includes("fs.stat") || line.includes("fs.readdir") || line.includes("fs.readFileSync"));
        if (isProbe && !content.includes("isPluginRunning") && !content.includes("isPluginInstalled") && !content.includes("listPlugins")) {
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
            docUrl: rule.docUrl
          });
        }
      }
    }
    if (!inTest && !inBuildOrTool) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isMcpConfig = line.includes(".claude.json") || line.includes("mcp_config.json") || line.includes("opencode.json");
        if (isMcpConfig && (line.includes("writeFile") || line.includes("writeFileSync")) && !content.includes("upsertMcpServer")) {
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
            docUrl: rule.docUrl
          });
        }
      }
    }
    if (!inTest && !inBuildOrTool) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isMcpSpawn = (line.includes("spawn(") || line.includes("child_process.exec(") || line.includes("execSync(") || line.includes("execFile(")) && (line.includes("mcp") || content.includes("jsonrpc") || line.includes("stdio"));
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
            docUrl: rule.docUrl
          });
        }
      }
    }
    if (!inTest && !inBuildOrTool && !relPath.includes("system.ts")) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isRawMetric = line.includes("os.loadavg()") || line.includes("os.cpus()") || line.includes("/proc/loadavg") || line.includes("/proc/stat");
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
            docUrl: rule.docUrl
          });
          break;
        }
      }
    }
    if (!inTest && !inBuildOrTool && !relPath.includes("version.ts")) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isVersionProbe = line.includes("package.json") && (line.includes(".version") || content.includes("JSON.parse(fs.readFileSync"));
        if (isVersionProbe && !content.includes("resolvePluginVersion") && !content.includes("stampVersion")) {
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
            docUrl: rule.docUrl
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
    suggestionCount: issues.filter((i) => i.severity === "suggestion").length
  };
  const passed = options.strict ? summary.errorCount === 0 && summary.warnCount === 0 : summary.errorCount === 0;
  return {
    targetDir: resolvedTarget,
    scannedFiles: files.length,
    issues,
    summary,
    passed
  };
}
var doctorProject = auditProject;

// src/cli/formatter.ts
function formatReportPretty(report) {
  const lines = [];
  lines.push(`Auditing Paseo plugin at ${report.targetDir}...`);
  lines.push("");
  if (report.issues.length === 0) {
    lines.push(`[PASS] Clean audit. All ${report.scannedFiles} files follow paseo-plugin-helper patterns.`);
    return lines.join("\n");
  }
  for (const issue of report.issues) {
    const prefix = issue.severity.toUpperCase().padEnd(10);
    lines.push(`[${prefix}] ${issue.file}:${issue.line}:${issue.column} (${issue.ruleId})`);
    lines.push(`           ${issue.message}`);
    if (issue.codeSnippet) {
      lines.push(`           Code: ${issue.codeSnippet}`);
    }
    lines.push(`           Replacement: ${issue.replacement}`);
    if (issue.docUrl) {
      lines.push(`           Docs: ${issue.docUrl}`);
    }
    lines.push("");
  }
  lines.push("--------------------------------------------------------------------------------");
  lines.push(
    `Audit Summary: ${report.issues.length} opportunities found across ${report.scannedFiles} scanned files (${report.summary.errorCount} errors, ${report.summary.warnCount} warnings, ${report.summary.suggestionCount} suggestions).`
  );
  if (!report.passed) {
    lines.push("Result: FAILED (strict mode enabled or errors found)");
  } else {
    lines.push("Result: PASSED with suggestions/warnings");
  }
  return lines.join("\n");
}
function formatReportJson(report) {
  return JSON.stringify(report, null, 2);
}

// src/cli/index.ts
function runCli(argv = process__default.default.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`
Paseo Plugin Helper CLI (audit & lint)

Usage:
  npx paseo-plugin-helper audit [path] [options]
  npx paseo-plugin-helper doctor [path] [options]
  npx paseo-plugin-helper [path] [options]

Options:
  --strict             Exit with code 1 if any warnings or errors are found
  --format <type>      Output format: pretty (default) or json
  --ignore <dirs>      Comma-separated list of directories to ignore
  -h, --help           Show this help message

Examples:
  npx paseo-plugin-helper audit .
  npx paseo-plugin-helper doctor .
  npx paseo-plugin-helper audit ~/code/my-plugin --strict
  npx paseo-plugin-helper audit . --format json
`);
    return 0;
  }
  let targetDir = ".";
  const options = {
    strict: false,
    format: "pretty",
    ignore: []
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "audit" || arg === "doctor") {
      continue;
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--format" && argv[i + 1]) {
      options.format = argv[i + 1] === "json" ? "json" : "pretty";
      i++;
    } else if (arg === "--ignore" && argv[i + 1]) {
      options.ignore = argv[i + 1].split(",").map((s) => s.trim());
      i++;
    } else if (!arg.startsWith("-")) {
      targetDir = arg;
    }
  }
  const report = auditProject(targetDir, options);
  if (options.format === "json") {
    console.log(formatReportJson(report));
  } else {
    console.log(formatReportPretty(report));
  }
  return report.passed ? 0 : 1;
}
var isMain = typeof process__default.default !== "undefined" && process__default.default.argv[1] && (process__default.default.argv[1].endsWith("/cli.js") || process__default.default.argv[1].endsWith("/cli.cjs") || process__default.default.argv[1].endsWith("/paseo-plugin-helper.js") || process__default.default.argv[1].includes("paseo-plugin-helper"));
if (isMain) {
  const exitCode = runCli();
  if (exitCode !== 0) {
    process__default.default.exit(exitCode);
  }
}

exports.AUDIT_RULES = AUDIT_RULES;
exports.auditProject = auditProject;
exports.doctorProject = doctorProject;
exports.formatReportJson = formatReportJson;
exports.formatReportPretty = formatReportPretty;
exports.runCli = runCli;
//# sourceMappingURL=cli.cjs.map
//# sourceMappingURL=cli.cjs.map
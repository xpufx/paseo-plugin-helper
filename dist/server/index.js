import fs from 'fs';
import path3 from 'path';
import os3 from 'os';
import { spawn, execSync } from 'child_process';
import net from 'net';

// src/server/storage.ts
var PluginStorage = class {
  pluginId;
  filename;
  filePath;
  defaultData;
  schema;
  constructor(pluginId, filename = "state.json", options = {}) {
    this.pluginId = pluginId;
    this.filename = filename;
    this.defaultData = options.defaultData;
    this.schema = options.schema;
    const base = options.baseDir || path3.join(os3.homedir(), ".paseo");
    const pluginDir = path3.join(base, pluginId);
    this.filePath = path3.join(pluginDir, filename);
  }
  ensureDir() {
    const dir = path3.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  getDefault() {
    if (this.schema) {
      const result = this.schema.safeParse(this.defaultData ?? {});
      if (result.success) {
        return result.data;
      }
    }
    return this.defaultData ? JSON.parse(JSON.stringify(this.defaultData)) : {};
  }
  parseData(raw) {
    if (this.schema) {
      const result = this.schema.safeParse(raw);
      if (result.success) {
        return result.data;
      }
      return this.getDefault();
    }
    return raw;
  }
  /**
   * Checks if the backing state file exists.
   */
  exists() {
    return fs.existsSync(this.filePath);
  }
  /**
   * Reads data synchronously. If file does not exist, returns defaultData or schema defaults.
   */
  read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return this.getDefault();
      }
      const raw = fs.readFileSync(this.filePath, "utf8");
      return this.parseData(JSON.parse(raw));
    } catch {
      return this.getDefault();
    }
  }
  /**
   * Reads data asynchronously.
   */
  async readAsync() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return this.getDefault();
      }
      const raw = await fs.promises.readFile(this.filePath, "utf8");
      return this.parseData(JSON.parse(raw));
    } catch {
      return this.getDefault();
    }
  }
  /**
   * Writes data atomically using a temporary file and atomic rename.
   */
  write(data) {
    const validated = this.parseData(data);
    this.ensureDir();
    const tempPath = `${this.filePath}.tmp.${process.pid}.${Date.now()}`;
    const serialized = JSON.stringify(validated, null, 2);
    fs.writeFileSync(tempPath, serialized, "utf8");
    fs.renameSync(tempPath, this.filePath);
  }
  /**
   * Writes data atomically using async filesystem operations.
   */
  async writeAsync(data) {
    const validated = this.parseData(data);
    this.ensureDir();
    const tempPath = `${this.filePath}.tmp.${process.pid}.${Date.now()}`;
    const serialized = JSON.stringify(validated, null, 2);
    await fs.promises.writeFile(tempPath, serialized, "utf8");
    await fs.promises.rename(tempPath, this.filePath);
  }
  /**
   * Updates state synchronously using an updater function.
   */
  update(updater) {
    const current = this.read();
    const updated = updater(current);
    const validated = this.parseData(updated);
    this.write(validated);
    return validated;
  }
  /**
   * Updates state asynchronously using an updater function.
   */
  async updateAsync(updater) {
    const current = await this.readAsync();
    const updated = await updater(current);
    const validated = this.parseData(updated);
    await this.writeAsync(validated);
    return validated;
  }
  /**
   * Removes the state file if it exists.
   */
  reset() {
    if (fs.existsSync(this.filePath)) {
      try {
        fs.unlinkSync(this.filePath);
      } catch {
      }
    }
  }
};

// src/server/settings.ts
function registerSettingsRpc(context, contract, storage, options = {}) {
  context.handle(contract.get, async () => {
    return storage.readAsync();
  });
  context.handle(contract.update, async (input) => {
    const prev = await storage.readAsync();
    const updated = await storage.updateAsync((current) => {
      return { ...current, ...input };
    });
    if (options.onUpdate) {
      await options.onUpdate(updated, prev);
    }
    return updated;
  });
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
function createSettingsHandlers(contract, storage, options = {}) {
  return {
    get: async () => {
      return storage.readAsync();
    },
    update: async (input) => {
      const prev = await storage.readAsync();
      const updated = await storage.updateAsync((current) => {
        return { ...current, ...input };
      });
      if (options.onUpdate) {
        await options.onUpdate(updated, prev);
      }
      return updated;
    },
    reset: async () => {
      const prev = await storage.readAsync();
      storage.reset();
      const fresh = await storage.readAsync();
      if (options.onReset) {
        await options.onReset(fresh, prev);
      }
      return fresh;
    }
  };
}

// src/server/jsonc.ts
function stripJsonComments(text) {
  let insideString = false;
  let stringDelimiter = "";
  let isEscaped = false;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (insideString) {
      result += char;
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === stringDelimiter) {
        insideString = false;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      insideString = true;
      stringDelimiter = char;
      result += char;
      continue;
    }
    if (char === "/" && nextChar === "/") {
      while (i < text.length && text[i] !== "\n" && text[i] !== "\r") {
        i++;
      }
      if (i < text.length) result += text[i];
      continue;
    }
    if (char === "/" && nextChar === "*") {
      i += 2;
      while (i < text.length - 1 && !(text[i] === "*" && text[i + 1] === "/")) {
        i++;
      }
      i++;
      continue;
    }
    result += char;
  }
  return result.replace(/,\s*([}\]])/g, "$1");
}
function parseJsonc(text) {
  const sanitized = stripJsonComments(text.trim());
  return JSON.parse(sanitized);
}
function tryParseJsonc(text, fallback) {
  try {
    return parseJsonc(text);
  } catch {
    return fallback;
  }
}

// src/server/redact.ts
var DEFAULT_SENSITIVE_KEYS = [
  "password",
  "passwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "access_token",
  "refresh_token",
  "privatekey",
  "private_key",
  "authorization",
  "auth",
  "credential",
  "credentials",
  "cert",
  "certificate"
];
function isSensitiveKey(key, customKeys = []) {
  const normalized = key.toLowerCase().replace(/[-_]/g, "");
  return [...DEFAULT_SENSITIVE_KEYS, ...customKeys].some(
    (k) => normalized.includes(k.replace(/[-_]/g, ""))
  );
}
function maskString(val, mask = "[REDACTED]") {
  if (val.length <= 8) return mask;
  const placeholder = mask === "[REDACTED]" ? "..." : mask;
  return `${val.slice(0, 3)}${placeholder}${val.slice(-3)}`;
}
function redactSecrets(target, options = {}) {
  const mask = options.mask ?? "[REDACTED]";
  const customKeys = options.customSensitiveKeys ?? [];
  if (target === null || target === void 0) return target;
  if (typeof target === "string") {
    let result = target.replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, `$1${mask}`);
    result = result.replace(/(https?:\/\/[^:]+:)[^@]+(@)/gi, `$1${mask}$2`);
    return result;
  }
  if (Array.isArray(target)) {
    return target.map((item) => redactSecrets(item, options));
  }
  if (typeof target === "object") {
    const clone = {};
    for (const [key, value] of Object.entries(target)) {
      if (isSensitiveKey(key, customKeys)) {
        clone[key] = typeof value === "string" ? maskString(value, mask) : mask;
      } else if (typeof value === "object" && value !== null) {
        clone[key] = redactSecrets(value, options);
      } else if (typeof value === "string") {
        clone[key] = redactSecrets(value, options);
      } else {
        clone[key] = value;
      }
    }
    return clone;
  }
  return target;
}
function safeSpawn(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs ?? 15e3;
    const maxBuffer = options.maxBuffer ?? 10 * 1024 * 1024;
    const child = spawn(command, args, {
      ...options,
      shell: false
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let timer = null;
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) child.kill("SIGKILL");
        }, 2e3);
      }, timeoutMs);
    }
    child.stdout?.on("data", (chunk) => {
      if (stdout.length < maxBuffer) {
        stdout += chunk.toString();
      }
    });
    child.stderr?.on("data", (chunk) => {
      if (stderr.length < maxBuffer) {
        stderr += chunk.toString();
      }
    });
    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code, signal) => {
      if (timer) clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      if (timedOut) {
        reject(new Error(`Command '${command}' timed out after ${timeoutMs}ms`));
        return;
      }
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code,
        signal,
        durationMs
      });
    });
  });
}
var CpuSampler = class {
  lastSample = null;
  constructor() {
    this.lastSample = this.getTicks();
  }
  getTicks() {
    const cpus = os3.cpus();
    return cpus.map((cpu) => {
      const times = cpu.times;
      const total = times.user + times.nice + times.sys + times.idle + times.irq;
      return { idle: times.idle, total };
    });
  }
  /**
   * Computes the CPU usage delta since the previous sample (or between two samples).
   * Returns average usage percentage (0 - 100) and per-core breakdown.
   */
  sample() {
    const current = this.getTicks();
    if (!this.lastSample || this.lastSample.length !== current.length) {
      this.lastSample = current;
      return { usagePercent: 0, perCore: current.map(() => 0) };
    }
    const perCore = [];
    let totalActive = 0;
    let totalTime = 0;
    for (let i = 0; i < current.length; i++) {
      const prev = this.lastSample[i];
      const cur = current[i];
      const deltaTotal = cur.total - prev.total;
      const deltaIdle = cur.idle - prev.idle;
      const deltaActive = Math.max(0, deltaTotal - deltaIdle);
      const corePercent = deltaTotal > 0 ? deltaActive / deltaTotal * 100 : 0;
      perCore.push(Math.round(corePercent * 10) / 10);
      totalActive += deltaActive;
      totalTime += deltaTotal;
    }
    this.lastSample = current;
    const usagePercent = totalTime > 0 ? totalActive / totalTime * 100 : 0;
    return {
      usagePercent: Math.round(usagePercent * 10) / 10,
      perCore
    };
  }
};
var defaultSampler = new CpuSampler();
function getSystemMetrics(sampler = defaultSampler) {
  const cpus = os3.cpus();
  const totalmem = os3.totalmem();
  const freemem = os3.freemem();
  const usedmem = totalmem - freemem;
  const cpuModel = cpus[0]?.model || "Unknown CPU";
  const { usagePercent } = sampler.sample();
  return {
    hostname: os3.hostname(),
    platform: process.platform,
    arch: process.arch,
    uptimeSeconds: Math.floor(os3.uptime()),
    cpu: {
      model: cpuModel,
      cores: cpus.length,
      usagePercent,
      loadAverage: os3.loadavg()
    },
    memory: {
      totalBytes: totalmem,
      freeBytes: freemem,
      usedBytes: usedmem,
      usedPercent: Math.round(usedmem / totalmem * 1e3) / 10
    }
  };
}
function findPackageJson(startDir) {
  let current = path3.resolve(startDir);
  const root = path3.parse(current).root;
  while (current !== root) {
    const pkgPath = path3.join(current, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const raw = fs.readFileSync(pkgPath, "utf8");
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    const parent = path3.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}
function resolvePluginVersion(options = {}) {
  const {
    cwd = process.cwd(),
    includeGit = true,
    fallback = "0.0.0"
  } = options;
  let pkgVersion;
  const pkg = findPackageJson(cwd);
  if (pkg?.version) {
    pkgVersion = pkg.version;
  }
  if (!includeGit) {
    return pkgVersion || fallback;
  }
  try {
    const gitTag = execSync("git describe --tags --exact-match 2>/dev/null", {
      cwd,
      encoding: "utf8",
      timeout: 1e3
    }).trim();
    if (gitTag) {
      return gitTag.startsWith("v") ? gitTag.slice(1) : gitTag;
    }
  } catch {
  }
  try {
    const gitHash = execSync("git rev-parse --short HEAD 2>/dev/null", {
      cwd,
      encoding: "utf8",
      timeout: 1e3
    }).trim();
    if (gitHash) {
      if (pkgVersion) {
        return `${pkgVersion}+${gitHash}`;
      }
      return `0.0.0+${gitHash}`;
    }
  } catch {
  }
  return pkgVersion || fallback;
}
function stampVersion(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const targetFile = options.targetFile ? path3.resolve(cwd, options.targetFile) : path3.resolve(cwd, "version.ts");
  const version = resolvePluginVersion(options);
  const content = `// Auto-generated by paseo-plugin-helper. Do not edit.
export const PLUGIN_VERSION = "${version}";
`;
  let existing = "";
  if (fs.existsSync(targetFile)) {
    existing = fs.readFileSync(targetFile, "utf8");
  }
  if (existing !== content) {
    fs.mkdirSync(path3.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, content, "utf8");
    return { version, targetFile, updated: true };
  }
  return { version, targetFile, updated: false };
}

// src/server/logger.ts
var LEVEL_SEVERITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};
function formatData(data) {
  if (data === void 0) return "";
  if (data instanceof Error) {
    return `error="${data.message}"${data.stack ? `
${data.stack}` : ""}`;
  }
  const sanitized = redactSecrets(data);
  if (typeof sanitized === "object" && sanitized !== null && !Array.isArray(sanitized)) {
    const pairs = Object.entries(sanitized).map(
      ([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`
    );
    return pairs.join(" ");
  }
  return typeof sanitized === "string" ? sanitized : JSON.stringify(sanitized);
}
function createPluginLogger(pluginId, options = {}) {
  const resolvedVer = options.version ?? resolvePluginVersion({ fallback: "" });
  const {
    banner = true,
    subsystem,
    minLevel = "info",
    meta = {}
  } = options;
  const minSeverity = LEVEL_SEVERITY[minLevel];
  const versionTag = resolvedVer ? ` v${resolvedVer}` : "";
  const subTag = subsystem ? `:${subsystem}` : "";
  const baseTag = `[${pluginId}${versionTag}${subTag}]`;
  if (banner) {
    const bannerDetails = [
      `pid ${process.pid}`,
      `node ${process.version}`,
      ...Object.entries(meta).map(([k, v]) => `${k} ${v}`)
    ].join(", ");
    console.log(`${baseTag} Initializing plugin (${bannerDetails})`);
  }
  function emit(level, message, data) {
    if (LEVEL_SEVERITY[level] < minSeverity) return;
    const levelTag = `[${level.toUpperCase()}]`;
    const formattedData = formatData(data);
    const line = formattedData ? `${baseTag} ${levelTag} ${message} ${formattedData}` : `${baseTag} ${levelTag} ${message}`;
    if (level === "error" || level === "warn") {
      console.error(line);
    } else {
      console.log(line);
    }
  }
  return {
    debug(message, data) {
      emit("debug", message, data);
    },
    info(message, data) {
      emit("info", message, data);
    },
    warn(message, data) {
      emit("warn", message, data);
    },
    error(message, data) {
      emit("error", message, data);
    },
    child(subsystemOrOptions) {
      const childOptions = typeof subsystemOrOptions === "string" ? { ...options, version: resolvedVer, banner: false, subsystem: subsystemOrOptions } : { ...options, version: resolvedVer, banner: false, ...subsystemOrOptions };
      return createPluginLogger(pluginId, childOptions);
    }
  };
}
function isPortOpen(port, host = "127.0.0.1", options) {
  const timeoutMs = options?.timeoutMs ?? 1e3;
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const cleanup = () => {
      if (!settled) {
        settled = true;
        socket.destroy();
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      cleanup();
      resolve(true);
    });
    socket.once("timeout", () => {
      cleanup();
      resolve(false);
    });
    socket.once("error", () => {
      cleanup();
      resolve(false);
    });
    try {
      socket.connect(port, host);
    } catch {
      cleanup();
      resolve(false);
    }
  });
}
function findAvailablePort(startPort = 3e3, maxAttempts = 50, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    const endPort = startPort + maxAttempts;
    function tryNext() {
      if (currentPort >= endPort) {
        return reject(new Error(`No available port found in range [${startPort}, ${endPort})`));
      }
      const server = net.createServer();
      server.once("error", () => {
        currentPort++;
        tryNext();
      });
      server.once("listening", () => {
        const addr = server.address();
        const port = typeof addr === "object" && addr ? addr.port : currentPort;
        server.close(() => {
          resolve(port);
        });
      });
      server.listen(currentPort, host);
    }
    tryNext();
  });
}
async function pingHost(host, port, options) {
  return isPortOpen(port, host, options);
}

// src/server/task.ts
function createPeriodicTask(options) {
  const {
    intervalMs,
    task,
    onError,
    runImmediately = false,
    maxBackoffMs = 6e4
  } = options;
  let timer = null;
  let running = true;
  let inFlight = false;
  let failureCount = 0;
  async function execute() {
    if (!running || inFlight) return;
    inFlight = true;
    try {
      await task();
      failureCount = 0;
    } catch (err) {
      failureCount++;
      if (onError) {
        try {
          onError(err, failureCount);
        } catch {
        }
      }
    } finally {
      inFlight = false;
      if (running) {
        scheduleNext();
      }
    }
  }
  function scheduleNext() {
    if (!running) return;
    if (timer) clearTimeout(timer);
    let delay = intervalMs;
    if (failureCount > 0) {
      const backoff = intervalMs * Math.pow(1.5, Math.min(failureCount, 8));
      delay = Math.min(backoff, maxBackoffMs);
    }
    timer = setTimeout(execute, delay);
  }
  if (runImmediately) {
    execute();
  } else {
    scheduleNext();
  }
  return {
    stop: () => {
      running = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
    isRunning: () => running,
    triggerNow: async () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      await execute();
    }
  };
}
var McpConfigPaths = {
  /**
   * Claude Desktop configuration path per operating system:
   * - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
   * - Windows: %APPDATA%/Claude/claude_desktop_config.json
   * - Linux: ~/.config/Claude/claude_desktop_config.json
   */
  claudeDesktop() {
    const platform = process.platform;
    const home = os3.homedir();
    if (platform === "darwin") {
      return path3.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
    }
    if (platform === "win32") {
      const appData = process.env.APPDATA || path3.join(home, "AppData", "Roaming");
      return path3.join(appData, "Claude", "claude_desktop_config.json");
    }
    const configDir = process.env.XDG_CONFIG_HOME || path3.join(home, ".config");
    return path3.join(configDir, "Claude", "claude_desktop_config.json");
  },
  /**
   * Claude Code CLI global configuration: ~/.claude.json
   */
  claudeCode() {
    return path3.join(os3.homedir(), ".claude.json");
  },
  /**
   * OpenCode configuration path: ~/.config/opencode/opencode.json
   */
  openCode() {
    const home = os3.homedir();
    const configDir = process.env.XDG_CONFIG_HOME || path3.join(home, ".config");
    return path3.join(configDir, "opencode", "opencode.json");
  },
  /**
   * Cursor editor MCP configuration: ~/.cursor/mcp.json
   */
  cursor() {
    return path3.join(os3.homedir(), ".cursor", "mcp.json");
  },
  /**
   * Gemini / Antigravity CLI configuration: ~/.gemini/config/mcp_config.json
   */
  gemini() {
    return path3.join(os3.homedir(), ".gemini", "config", "mcp_config.json");
  },
  /**
   * Pi CLI agent configuration: ~/.pi/config.json
   */
  pi() {
    return path3.join(os3.homedir(), ".pi", "config.json");
  }
};
function expandPath(targetPath) {
  if (targetPath === "~") {
    return os3.homedir();
  }
  if (targetPath.startsWith("~/") || targetPath.startsWith("~\\")) {
    return path3.join(os3.homedir(), targetPath.slice(2));
  }
  return path3.resolve(targetPath);
}
function isDeepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqual(a[key], b[key])) return false;
  }
  return true;
}
function normalizeTarget(target, backupOverride) {
  if (typeof target === "string") {
    return {
      filePath: expandPath(target),
      key: "mcpServers",
      backup: Boolean(backupOverride)
    };
  }
  return {
    filePath: expandPath(target.path),
    key: target.key || "mcpServers",
    backup: backupOverride !== void 0 ? backupOverride : Boolean(target.backup)
  };
}
function readConfigDocument(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) {
    return {};
  }
  return parseJsonc(raw);
}
function writeConfigAtomic(filePath, data) {
  const dir = path3.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  const serialized = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(tempPath, serialized, "utf8");
  fs.renameSync(tempPath, filePath);
}
function getMcpServer(target, serverName) {
  const { filePath, key } = normalizeTarget(target);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const doc = readConfigDocument(filePath);
    const servers = doc[key];
    if (servers && typeof servers === "object" && serverName in servers) {
      return servers[serverName];
    }
    return null;
  } catch {
    return null;
  }
}
function upsertMcpServer(options) {
  const { filePath, key, backup } = normalizeTarget(options.target, options.backup);
  const { serverName, config } = options;
  let doc;
  const fileExisted = fs.existsSync(filePath);
  if (fileExisted) {
    doc = readConfigDocument(filePath);
  } else {
    doc = {};
  }
  if (typeof doc[key] !== "object" || doc[key] === null || Array.isArray(doc[key])) {
    doc[key] = {};
  }
  const existingConfig = doc[key][serverName];
  const isExisting = existingConfig !== void 0;
  if (isExisting && isDeepEqual(existingConfig, config)) {
    return {
      filePath,
      serverName,
      changed: false,
      action: "unchanged"
    };
  }
  let backupPath;
  if (backup && fileExisted) {
    backupPath = `${filePath}.bak.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
  }
  doc[key][serverName] = config;
  writeConfigAtomic(filePath, doc);
  return {
    filePath,
    serverName,
    changed: true,
    action: isExisting ? "updated" : "created",
    backupPath
  };
}
function removeMcpServer(options) {
  const { filePath, key, backup } = normalizeTarget(options.target, options.backup);
  const { serverName } = options;
  if (!fs.existsSync(filePath)) {
    return {
      filePath,
      serverName,
      changed: false,
      action: "not_found"
    };
  }
  const doc = readConfigDocument(filePath);
  if (!doc[key] || typeof doc[key] !== "object" || !(serverName in doc[key])) {
    return {
      filePath,
      serverName,
      changed: false,
      action: "not_found"
    };
  }
  let backupPath;
  if (backup) {
    backupPath = `${filePath}.bak.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
  }
  delete doc[key][serverName];
  writeConfigAtomic(filePath, doc);
  return {
    filePath,
    serverName,
    changed: true,
    action: "removed",
    backupPath
  };
}
var cachedPlugins = null;
var lastFetchTime = 0;
function clearPluginCache() {
  cachedPlugins = null;
  lastFetchTime = 0;
}
function readConfigPluginsFallback() {
  try {
    const configPath = path3.join(os3.homedir(), ".paseo", "config.json");
    if (!fs.existsSync(configPath)) return [];
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    const pluginsObj = parsed?.plugins;
    if (!pluginsObj || typeof pluginsObj !== "object") return [];
    return Object.entries(pluginsObj).map(([id, val]) => {
      const isEnabled = val?.enabled !== false;
      return {
        id,
        path: val?.path ?? "",
        enabled: isEnabled,
        status: isEnabled ? "unknown" : "disabled",
        source: val?.source,
        remote: val?.remote,
        ref: val?.ref,
        commit: val?.commit
      };
    });
  } catch {
    return [];
  }
}
async function listPlugins(options = {}) {
  const { filter = "all", cacheTtlMs = 5e3, forceRefresh = false } = options;
  const now = Date.now();
  if (!forceRefresh && cachedPlugins && now - lastFetchTime < cacheTtlMs) {
    return applyFilter(cachedPlugins, filter);
  }
  let plugins = [];
  try {
    const result = await safeSpawn("paseo", ["plugin", "ls", "--json"], { timeoutMs: 3e3 });
    if (result.code === 0 && result.stdout.trim()) {
      plugins = JSON.parse(result.stdout.trim());
    } else {
      plugins = readConfigPluginsFallback();
    }
  } catch {
    plugins = readConfigPluginsFallback();
  }
  cachedPlugins = plugins;
  lastFetchTime = now;
  return applyFilter(plugins, filter);
}
function applyFilter(plugins, filter) {
  switch (filter) {
    case "enabled":
      return plugins.filter((p) => p.enabled);
    case "disabled":
      return plugins.filter((p) => !p.enabled);
    case "running":
      return plugins.filter((p) => p.status === "running");
    case "failed":
      return plugins.filter((p) => p.status === "failed");
    case "all":
    default:
      return plugins;
  }
}
async function getPluginInfo(pluginId, options) {
  const plugins = await listPlugins(options);
  return plugins.find((p) => p.id === pluginId) ?? null;
}
async function isPluginInstalled(pluginId, options) {
  const info = await getPluginInfo(pluginId, options);
  return info !== null;
}
async function isPluginEnabled(pluginId, options) {
  const info = await getPluginInfo(pluginId, options);
  return info !== null && info.enabled;
}
async function isPluginRunning(pluginId, options) {
  const info = await getPluginInfo(pluginId, options);
  return info !== null && info.status === "running";
}

export { CpuSampler, McpConfigPaths, PluginStorage, clearPluginCache, createPeriodicTask, createPluginLogger, createSettingsHandlers, expandPath, findAvailablePort, getMcpServer, getPluginInfo, getSystemMetrics, isPluginEnabled, isPluginInstalled, isPluginRunning, isPortOpen, listPlugins, parseJsonc, pingHost, redactSecrets, registerSettingsRpc, removeMcpServer, resolvePluginVersion, safeSpawn, stampVersion, stripJsonComments, tryParseJsonc, upsertMcpServer };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
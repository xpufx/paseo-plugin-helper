import { spawn, type SpawnOptions } from "node:child_process";

export interface SafeSpawnOptions extends SpawnOptions {
  timeoutMs?: number;
  maxBuffer?: number;
}

export interface SafeSpawnResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
}

/**
 * Spawns a process safely with timeout management, stdout/stderr capture,
 * and clean process group termination without shell vulnerabilities.
 */
export function safeSpawn(
  command: string,
  args: string[] = [],
  options: SafeSpawnOptions = {},
): Promise<SafeSpawnResult> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs ?? 15000;
    const maxBuffer = options.maxBuffer ?? 10 * 1024 * 1024; // 10MB

    const child = spawn(command, args, {
      ...options,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let timer: NodeJS.Timeout | null = null;

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) child.kill("SIGKILL");
        }, 2000);
      }, timeoutMs);
    }

    child.stdout?.on("data", (chunk: Buffer | string) => {
      if (stdout.length < maxBuffer) {
        stdout += chunk.toString();
      }
    });

    child.stderr?.on("data", (chunk: Buffer | string) => {
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
        durationMs,
      });
    });
  });
}

/**
 * Executes a shell command line string with timeout protection, stdout/stderr capture,
 * and clean process termination.
 */
export function safeExec(
  command: string,
  options: SafeSpawnOptions = {},
): Promise<SafeSpawnResult> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs ?? 15000;
    const maxBuffer = options.maxBuffer ?? 10 * 1024 * 1024; // 10MB

    const child = spawn(command, {
      ...options,
      shell: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let timer: NodeJS.Timeout | null = null;

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) child.kill("SIGKILL");
        }, 2000);
      }, timeoutMs);
    }

    child.stdout?.on("data", (chunk: Buffer | string) => {
      if (stdout.length < maxBuffer) {
        stdout += chunk.toString();
      }
    });

    child.stderr?.on("data", (chunk: Buffer | string) => {
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
        durationMs,
      });
    });
  });
}

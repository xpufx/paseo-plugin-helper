import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface PluginStorageOptions<T> {
  defaultData?: T;
  /**
   * Base directory override. Defaults to ~/.paseo
   */
  baseDir?: string;
}

/**
 * Scoped, atomic filesystem-backed document storage for Paseo daemon plugins.
 * Automatically handles directory creation, atomic temporary file swaps,
 * and default state fallback.
 */
export class PluginStorage<T extends Record<string, any>> {
  readonly pluginId: string;
  readonly filename: string;
  readonly filePath: string;
  readonly defaultData?: T;

  constructor(pluginId: string, filename = "state.json", options: PluginStorageOptions<T> = {}) {
    this.pluginId = pluginId;
    this.filename = filename;
    this.defaultData = options.defaultData;

    const base = options.baseDir || path.join(os.homedir(), ".paseo");
    const pluginDir = path.join(base, pluginId);
    this.filePath = path.join(pluginDir, filename);
  }

  private ensureDir(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Checks if the backing state file exists.
   */
  exists(): boolean {
    return fs.existsSync(this.filePath);
  }

  /**
   * Reads data synchronously. If file does not exist, returns defaultData or an empty object.
   */
  read(): T {
    try {
      if (!fs.existsSync(this.filePath)) {
        return this.defaultData ? (JSON.parse(JSON.stringify(this.defaultData)) as T) : ({} as T);
      }
      const raw = fs.readFileSync(this.filePath, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return this.defaultData ? (JSON.parse(JSON.stringify(this.defaultData)) as T) : ({} as T);
    }
  }

  /**
   * Reads data asynchronously.
   */
  async readAsync(): Promise<T> {
    try {
      if (!fs.existsSync(this.filePath)) {
        return this.defaultData ? (JSON.parse(JSON.stringify(this.defaultData)) as T) : ({} as T);
      }
      const raw = await fs.promises.readFile(this.filePath, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return this.defaultData ? (JSON.parse(JSON.stringify(this.defaultData)) as T) : ({} as T);
    }
  }

  /**
   * Writes data atomically using a temporary file and atomic rename.
   */
  write(data: T): void {
    this.ensureDir();
    const tempPath = `${this.filePath}.tmp.${process.pid}.${Date.now()}`;
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempPath, serialized, "utf8");
    fs.renameSync(tempPath, this.filePath);
  }

  /**
   * Writes data atomically using async filesystem operations.
   */
  async writeAsync(data: T): Promise<void> {
    this.ensureDir();
    const tempPath = `${this.filePath}.tmp.${process.pid}.${Date.now()}`;
    const serialized = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tempPath, serialized, "utf8");
    await fs.promises.rename(tempPath, this.filePath);
  }

  /**
   * Updates state synchronously using an updater function.
   */
  update(updater: (prev: T) => T): T {
    const current = this.read();
    const updated = updater(current);
    this.write(updated);
    return updated;
  }

  /**
   * Updates state asynchronously using an updater function.
   */
  async updateAsync(updater: (prev: T) => Promise<T> | T): Promise<T> {
    const current = await this.readAsync();
    const updated = await updater(current);
    await this.writeAsync(updated);
    return updated;
  }

  /**
   * Removes the state file if it exists.
   */
  reset(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        fs.unlinkSync(this.filePath);
      } catch {}
    }
  }
}

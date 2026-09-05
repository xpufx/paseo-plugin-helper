import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { ZodType } from "zod";

export interface PluginStorageOptions<T> {
  defaultData?: T;
  /**
   * Base directory override. Defaults to ~/.paseo
   */
  baseDir?: string;
  /**
   * Optional Zod schema to validate and parse data on read/write, automatically applying defaults.
   */
  schema?: ZodType<T>;
}

/**
 * Scoped, atomic filesystem-backed document storage for Paseo daemon plugins.
 * Automatically handles directory creation, atomic temporary file swaps,
 * schema validation, and default state fallback.
 */
export class PluginStorage<T extends Record<string, any>> {
  readonly pluginId: string;
  readonly filename: string;
  readonly filePath: string;
  readonly defaultData?: T;
  readonly schema?: ZodType<T>;

  constructor(pluginId: string, filename = "state.json", options: PluginStorageOptions<T> = {}) {
    this.pluginId = pluginId;
    this.filename = filename;
    this.defaultData = options.defaultData;
    this.schema = options.schema;

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

  private getDefault(): T {
    if (this.schema) {
      const result = this.schema.safeParse(this.defaultData ?? {});
      if (result.success) {
        return result.data;
      }
    }
    return this.defaultData ? (JSON.parse(JSON.stringify(this.defaultData)) as T) : ({} as T);
  }

  private parseData(raw: unknown): T {
    if (this.schema) {
      const result = this.schema.safeParse(raw);
      if (result.success) {
        return result.data;
      }
      return this.getDefault();
    }
    return raw as T;
  }

  /**
   * Checks if the backing state file exists.
   */
  exists(): boolean {
    return fs.existsSync(this.filePath);
  }

  /**
   * Reads data synchronously. If file does not exist, returns defaultData or schema defaults.
   */
  read(): T {
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
  async readAsync(): Promise<T> {
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
  write(data: T): void {
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
  async writeAsync(data: T): Promise<void> {
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
  update(updater: (prev: T) => T): T {
    const current = this.read();
    const updated = updater(current);
    const validated = this.parseData(updated);
    this.write(validated);
    return validated;
  }

  /**
   * Updates state asynchronously using an updater function.
   */
  async updateAsync(updater: (prev: T) => Promise<T> | T): Promise<T> {
    const current = await this.readAsync();
    const updated = await updater(current);
    const validated = this.parseData(updated);
    await this.writeAsync(validated);
    return validated;
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

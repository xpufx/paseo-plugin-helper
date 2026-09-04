import { describe, it, expect } from "vitest";
import {
  formatBytes,
  formatUptime,
  formatDuration,
  formatNumber,
  truncate,
} from "../shared/formatters.js";

describe("Shared Formatters", () => {
  it("formats bytes correctly across units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(500)).toBe("500.0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024 * 4.5)).toBe("4.5 MB");
    expect(formatBytes(1024 * 1024 * 1024 * 2.25)).toBe("2.3 GB");
  });

  it("formats uptime duration into readable text", () => {
    expect(formatUptime(0)).toBe("0m");
    expect(formatUptime(45)).toBe("45s");
    expect(formatUptime(150)).toBe("2m");
    expect(formatUptime(3665)).toBe("1h 1m");
    expect(formatUptime(86400 * 3 + 3600 * 4 + 60 * 12)).toBe("3d 4h 12m");
  });

  it("formats duration in milliseconds", () => {
    expect(formatDuration(0)).toBe("0ms");
    expect(formatDuration(150)).toBe("150ms");
    expect(formatDuration(1200)).toBe("1.2s");
    expect(formatDuration(65000)).toBe("1m");
  });

  it("formats numbers with comma separators", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncate("hello", 10)).toBe("hello");
    expect(truncate("hello world and universe", 10)).toBe("hello wor…");
    expect(truncate("", 5)).toBe("");
  });
});

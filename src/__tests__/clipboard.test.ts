import { describe, it, expect, vi, beforeEach } from "vitest";
import { copyToClipboard } from "../client/utils/clipboard.js";

describe("copyToClipboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false for null or undefined input", async () => {
    expect(await copyToClipboard(null as any)).toBe(false);
    expect(await copyToClipboard(undefined as any)).toBe(false);
  });

  it("copies via navigator.clipboard when available", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: { writeText: writeTextMock },
      },
      configurable: true,
      writable: true,
    });

    const toastShow = vi.fn();
    const result = await copyToClipboard("hello-world", {
      toast: { show: toastShow } as any,
      toastMessage: "Greeting",
    });

    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith("hello-world");
    expect(toastShow).toHaveBeenCalledWith("Copied Greeting to clipboard", { variant: "success" });
  });

  it("supports Paseo toast.copied callback", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: { writeText: writeTextMock },
      },
      configurable: true,
      writable: true,
    });

    const toastCopied = vi.fn();
    const result = await copyToClipboard("123", {
      toast: { copied: toastCopied } as any,
      toastMessage: "Host",
    });

    expect(result).toBe(true);
    expect(toastCopied).toHaveBeenCalledWith("Host");
  });
});

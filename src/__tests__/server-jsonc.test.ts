import { describe, it, expect } from "vitest";
import { parseJsonc, stripJsonComments } from "../server/jsonc.js";

describe("JSONC Parser", () => {
  it("strips single-line and multi-line comments", () => {
    const input = `
    {
      // This is a single line comment
      "name": "paseo-test",
      /*
        This is a multi-line
        block comment
      */
      "version": 1
    }
    `;

    const parsed = parseJsonc<{ name: string; version: number }>(input);
    expect(parsed.name).toBe("paseo-test");
    expect(parsed.version).toBe(1);
  });

  it("handles trailing commas in objects and arrays", () => {
    const input = `
    {
      "items": [
        "one",
        "two",
      ],
      "enabled": true,
    }
    `;

    const parsed = parseJsonc<{ items: string[]; enabled: boolean }>(input);
    expect(parsed.items).toEqual(["one", "two"]);
    expect(parsed.enabled).toBe(true);
  });

  it("does not corrupt URLs or strings containing // or /*", () => {
    const input = `
    {
      "url": "https://api.example.com/v1/resource",
      "regex": "/* not a comment */"
    }
    `;

    const parsed = parseJsonc<{ url: string; regex: string }>(input);
    expect(parsed.url).toBe("https://api.example.com/v1/resource");
    expect(parsed.regex).toBe("/* not a comment */");
  });
});

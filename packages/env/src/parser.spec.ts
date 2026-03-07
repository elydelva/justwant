import { describe, expect, test } from "bun:test";
import { loadEnvFile, parseEnvFile } from "./parser.js";

describe("parseEnvFile", () => {
  describe("happy path", () => {
    test("parses KEY=value pairs", () => {
      const result = parseEnvFile("FOO=bar\nBAZ=qux");
      expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
    });

    test("parses export KEY=value (bash compatibility)", () => {
      const result = parseEnvFile("export FOO=bar");
      expect(result).toEqual({ FOO: "bar" });
    });

    test("trims key and value", () => {
      const result = parseEnvFile("  FOO  =  bar  ");
      expect(result).toEqual({ FOO: "bar" });
    });

    test("skips empty lines", () => {
      const result = parseEnvFile("FOO=bar\n\n\nBAZ=qux");
      expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
    });

    test("skips comment lines", () => {
      const result = parseEnvFile("# comment\nFOO=bar\n# another\nBAZ=qux");
      expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
    });

    test("removes inline comment from unquoted value", () => {
      const result = parseEnvFile("FOO=bar # inline comment");
      expect(result).toEqual({ FOO: "bar" });
    });
  });

  describe("quoted values", () => {
    test("parses double-quoted value with escapes", () => {
      const result = parseEnvFile('FOO="hello\\nworld"');
      expect(result).toEqual({ FOO: "hello\nworld" });
    });

    test("parses double-quoted value with \\r and \\t", () => {
      const result = parseEnvFile('FOO="a\\rb\\tc"');
      expect(result).toEqual({ FOO: "a\rb\tc" });
    });

    test("parses double-quoted value with escaped quote", () => {
      const result = parseEnvFile('FOO="say \\"hi\\""');
      expect(result).toEqual({ FOO: 'say "hi"' });
    });

    test("parses single-quoted value (no escape except closing quote)", () => {
      const result = parseEnvFile("FOO='hello world'");
      expect(result).toEqual({ FOO: "hello world" });
    });

    test("single-quoted value preserves backslash literally", () => {
      const result = parseEnvFile("FOO='hello\\nworld'");
      expect(result).toEqual({ FOO: "hello\\nworld" });
    });
  });

  describe("line continuation", () => {
    test("joins lines ending with backslash", () => {
      const result = parseEnvFile("FOO=line1\\\nline2");
      expect(result).toEqual({ FOO: "line1\nline2" });
    });

    test("handles multiple continuations", () => {
      const result = parseEnvFile("FOO=a\\\nb\\\nc");
      expect(result).toEqual({ FOO: "a\nb\nc" });
    });
  });

  describe("edge cases", () => {
    test("handles empty content", () => {
      const result = parseEnvFile("");
      expect(result).toEqual({});
    });

    test("handles only comments and empty lines", () => {
      const result = parseEnvFile("# comment\n\n# another");
      expect(result).toEqual({});
    });

    test("skips malformed lines (no = or key empty)", () => {
      const result = parseEnvFile("=value\nFOO=bar\nKEY");
      expect(result).toEqual({ FOO: "bar" });
    });

    test("handles CRLF line endings", () => {
      const result = parseEnvFile("FOO=bar\r\nBAZ=qux");
      expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
    });

    test("later key overwrites earlier", () => {
      const result = parseEnvFile("FOO=a\nFOO=b");
      expect(result).toEqual({ FOO: "b" });
    });
  });
});

describe("loadEnvFile", () => {
  test("returns empty object when file does not exist", () => {
    const result = loadEnvFile(".env.nonexistent", "/tmp");
    expect(result).toEqual({});
  });

  test("returns empty object when read fails", () => {
    const result = loadEnvFile(".env", "/nonexistent/path/12345");
    expect(result).toEqual({});
  });

  test("loads and parses existing .env file", async () => {
    const { join } = await import("node:path");
    const { unlinkSync, existsSync } = await import("node:fs");
    const dir = import.meta.dirname;
    const path = ".env.parser.spec.tmp";
    const fullPath = join(dir, path);
    await Bun.write(fullPath, "FOO=bar\nBAZ=qux");
    try {
      const result = loadEnvFile(path, dir);
      expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
    } finally {
      if (existsSync(fullPath)) unlinkSync(fullPath);
    }
  });
});

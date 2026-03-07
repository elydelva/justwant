import { describe, expect, test } from "bun:test";
import { mergeSources } from "./utils.js";

describe("mergeSources", () => {
  test("inline overrides processEnv", () => {
    const result = mergeSources(
      { processEnv: { FOO: "from-env", BAR: "from-env" }, inline: { FOO: "from-inline" } },
      "/tmp",
      false
    );
    expect(result.FOO).toBe("from-inline");
    expect(result.BAR).toBe("from-env");
  });

  test("processEnv overrides files", () => {
    const result = mergeSources(
      {
        files: [],
        processEnv: { FOO: "from-process" },
        inline: {},
      },
      "/tmp",
      false
    );
    expect(result.FOO).toBe("from-process");
  });

  test("processEnv: false excludes process.env", () => {
    const result = mergeSources(
      { processEnv: false, inline: { FOO: "only-inline" } },
      "/tmp",
      false
    );
    expect(result.FOO).toBe("only-inline");
    expect(Object.keys(result)).toEqual(["FOO"]);
  });

  test("processEnv object used when provided", () => {
    const customEnv = { A: "a", B: "b" };
    const result = mergeSources({ processEnv: customEnv, inline: {} }, "/tmp", false);
    expect(result.A).toBe("a");
    expect(result.B).toBe("b");
  });

  test("expand: true expands variables in result", () => {
    const result = mergeSources({ inline: { BASE: "https", URL: "${BASE}/api" } }, "/tmp", true);
    expect(result.URL).toBe("https/api");
  });

  test("expand: false leaves variables unexpanded", () => {
    const result = mergeSources({ inline: { BASE: "https", URL: "${BASE}/api" } }, "/tmp", false);
    expect(result.URL).toBe("${BASE}/api");
  });

  test("files are loaded in order (later overrides earlier)", async () => {
    const { join } = await import("node:path");
    const { unlinkSync, existsSync } = await import("node:fs");
    const dir = import.meta.dirname;
    const f1 = ".env.utils.spec.1.tmp";
    const f2 = ".env.utils.spec.2.tmp";
    await Bun.write(join(dir, f1), "FOO=first");
    await Bun.write(join(dir, f2), "FOO=second");
    try {
      const result = mergeSources({ files: [f1, f2], processEnv: false }, dir, false);
      expect(result.FOO).toBe("second");
    } finally {
      if (existsSync(join(dir, f1))) unlinkSync(join(dir, f1));
      if (existsSync(join(dir, f2))) unlinkSync(join(dir, f2));
    }
  });
});

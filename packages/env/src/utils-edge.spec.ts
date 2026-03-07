import { describe, expect, test } from "bun:test";
import { mergeSources } from "./utils-edge.js";

describe("mergeSources (edge)", () => {
  test("uses processEnv when object provided", () => {
    const result = mergeSources({ processEnv: { FOO: "bar", BAZ: "qux" } }, "/ignored", false);
    expect(result.FOO).toBe("bar");
    expect(result.BAZ).toBe("qux");
  });

  test("inline overrides processEnv", () => {
    const result = mergeSources(
      { processEnv: { FOO: "env" }, inline: { FOO: "inline" } },
      "/",
      false
    );
    expect(result.FOO).toBe("inline");
  });

  test("processEnv: false excludes env", () => {
    const result = mergeSources({ processEnv: false, inline: { X: "y" } }, "/", false);
    expect(result).toEqual({ X: "y" });
  });

  test("expand: true expands variables", () => {
    const result = mergeSources({ inline: { A: "1", B: "${A}2" } }, "/", true);
    expect(result.B).toBe("12");
  });

  test("ignores files config (no fs in edge)", () => {
    const result = mergeSources(
      { files: [".env"], processEnv: false, inline: { FOO: "bar" } },
      "/tmp",
      false
    );
    expect(result.FOO).toBe("bar");
  });
});

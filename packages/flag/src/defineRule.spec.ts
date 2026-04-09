import { describe, expect, test } from "bun:test";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { defineRule } from "./defineRule.js";

describe("defineRule", () => {
  test("returns RuleDef with id and logic", () => {
    const rule = defineRule({
      name: "test",
      logic: ({ config, context }) => (context as { enabled: boolean }).enabled,
    });
    expect(rule.name).toBe("test");
    expect(rule.logic).toBeDefined();
  });

  test("logic can be sync", async () => {
    const rule = defineRule({
      name: "sync",
      logic: () => true,
    });
    const result = await rule.logic({ config: {}, context: {} });
    expect(result).toBe(true);
  });

  test("logic can be async", async () => {
    const rule = defineRule({
      name: "async",
      logic: async () => false,
    });
    const result = await rule.logic({ config: {}, context: {} });
    expect(result).toBe(false);
  });

  test("defaultConfig is used when no override", () => {
    const rule = defineRule({
      name: "with-default",
      defaultConfig: { pct: 0.5 },
      logic: ({ config }) => (config as { pct: number }).pct > 0.3,
    });
    expect(rule.defaultConfig).toEqual({ pct: 0.5 });
  });

  test("accepts config and context schema", () => {
    const configSchema: StandardSchemaV1<unknown, { pct: number }> = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (val: unknown) =>
          (val as { pct?: number }).pct != null
            ? { value: val as { pct: number } }
            : { issues: [{ message: "pct required" }] },
      },
    };
    const contextSchema: StandardSchemaV1<unknown, { userId: string }> = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (val: unknown) =>
          (val as { userId?: string }).userId
            ? { value: val as { userId: string } }
            : { issues: [{ message: "userId required" }] },
      },
    };
    const rule = defineRule({
      name: "with-schema",
      config: configSchema,
      context: contextSchema,
      logic: ({ config }) => config.pct > 0,
    });
    expect(rule.config).toBeDefined();
    expect(rule.context).toBeDefined();
  });
});

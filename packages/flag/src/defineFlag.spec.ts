import { describe, expect, test } from "bun:test";
import { defineFlag } from "./defineFlag.js";
import { defineRule } from "./defineRule.js";

describe("defineFlag", () => {
  const ruleA = defineRule({ id: "a", logic: () => true });
  const ruleB = defineRule({ id: "b", logic: () => false });

  test("returns FlagDef with id and rules", () => {
    const flag = defineFlag({ id: "test", rules: [ruleA] });
    expect(flag.id).toBe("test");
    expect(flag.rules).toHaveLength(1);
    expect(flag.rules[0]).toBe(ruleA);
  });

  test("strategy defaults to any", () => {
    const flag = defineFlag({ id: "test", rules: [ruleA, ruleB] });
    expect(flag.strategy).toBe("any");
  });

  test("strategy all requires all rules true", async () => {
    const flag = defineFlag({
      id: "all",
      rules: [ruleA, ruleB],
      strategy: "all",
    });
    expect(flag.strategy).toBe("all");
  });

  test("default is used when no rules", () => {
    const flag = defineFlag({ id: "empty", rules: [], default: true });
    expect(flag.default).toBe(true);
  });
});

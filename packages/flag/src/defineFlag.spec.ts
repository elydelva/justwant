import { describe, expect, test } from "bun:test";
import { defineFeature } from "@justwant/feature";
import { defineFlag } from "./defineFlag.js";
import { defineRule } from "./defineRule.js";

describe("defineFlag", () => {
  const testFeature = defineFeature({ name: "test" });
  const ruleA = defineRule({ id: "a", logic: () => true });
  const ruleB = defineRule({ id: "b", logic: () => false });

  test("returns FlagDef with id derived from feature name", () => {
    const flag = defineFlag(testFeature, { rules: [ruleA] });
    expect(flag.id).toBe("test");
    expect(flag.feature).toBe(testFeature);
    expect(flag.rules).toHaveLength(1);
    expect(flag.rules[0]).toBe(ruleA);
  });

  test("strategy defaults to any", () => {
    const flag = defineFlag(testFeature, { rules: [ruleA, ruleB] });
    expect(flag.strategy).toBe("any");
  });

  test("strategy all requires all rules true", () => {
    const flag = defineFlag(testFeature, { rules: [ruleA, ruleB], strategy: "all" });
    expect(flag.strategy).toBe("all");
  });

  test("default is used when no rules", () => {
    const flag = defineFlag(testFeature, { rules: [], default: true });
    expect(flag.default).toBe(true);
  });
});

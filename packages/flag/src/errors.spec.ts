import { describe, expect, test } from "bun:test";
import { FlagError, FlagValidationError, RuleNotFoundError } from "./errors.js";

describe("FlagError", () => {
  test("creates error with message and code", () => {
    const err = new FlagError("test", "CODE", { foo: "bar" });
    expect(err.message).toBe("test");
    expect(err.code).toBe("CODE");
    expect(err.metadata).toEqual({ foo: "bar" });
    expect(err.name).toBe("FlagError");
  });
});

describe("FlagValidationError", () => {
  test("creates error with message", () => {
    const err = new FlagValidationError("invalid config", { ruleId: "r1" });
    expect(err.message).toBe("invalid config");
    expect(err.code).toBe("FLAG_VALIDATION_ERROR");
    expect(err.metadata).toEqual({ ruleId: "r1" });
    expect(err.name).toBe("FlagValidationError");
  });
});

describe("RuleNotFoundError", () => {
  test("creates error with ruleId", () => {
    const err = new RuleNotFoundError("beta-rollout");
    expect(err.message).toContain("beta-rollout");
    expect(err.code).toBe("RULE_NOT_FOUND");
    expect(err.ruleId).toBe("beta-rollout");
    expect(err.name).toBe("RuleNotFoundError");
  });
});

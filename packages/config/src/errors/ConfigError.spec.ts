import { describe, expect, test } from "bun:test";
import { ConfigError, ConfigValidationError } from "./ConfigError.js";

describe("ConfigError", () => {
  test("has name ConfigError", () => {
    const err = new ConfigError("test");
    expect(err.name).toBe("ConfigError");
    expect(err.message).toBe("test");
  });
});

describe("ConfigValidationError", () => {
  test("has name and issues array", () => {
    const issues = [{ key: "foo", message: "Invalid" }];
    const err = new ConfigValidationError(issues);
    expect(err.name).toBe("ConfigValidationError");
    expect(err.issues).toEqual(issues);
    expect(err.message).toContain("foo");
    expect(err.message).toContain("Invalid");
  });

  test("extends ConfigError", () => {
    const err = new ConfigValidationError([]);
    expect(err).toBeInstanceOf(ConfigError);
  });
});

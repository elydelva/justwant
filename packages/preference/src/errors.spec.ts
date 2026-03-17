import { describe, expect, test } from "bun:test";
import { PreferenceError, PreferenceNotFoundError, PreferenceValidationError } from "./errors.js";

describe("PreferenceError", () => {
  test("creates error with message and code", () => {
    const err = new PreferenceError("test", "CODE", { foo: "bar" });
    expect(err.message).toBe("test");
    expect(err.code).toBe("CODE");
    expect(err.metadata).toEqual({ foo: "bar" });
    expect(err.name).toBe("PreferenceError");
  });

  test("defaults to PREFERENCE_ERROR code", () => {
    const err = new PreferenceError("msg");
    expect(err.code).toBe("PREFERENCE_ERROR");
  });
});

describe("PreferenceValidationError", () => {
  test("creates error with message", () => {
    const err = new PreferenceValidationError("invalid value", { key: "theme" });
    expect(err.message).toBe("invalid value");
    expect(err.code).toBe("PREFERENCE_VALIDATION_ERROR");
    expect(err.metadata).toEqual({ key: "theme" });
    expect(err.name).toBe("PreferenceValidationError");
  });
});

describe("PreferenceNotFoundError", () => {
  test("creates error with key", () => {
    const err = new PreferenceNotFoundError("theme");
    expect(err.message).toContain("theme");
    expect(err.code).toBe("PREFERENCE_NOT_FOUND");
    expect(err.key).toBe("theme");
    expect(err.name).toBe("PreferenceNotFoundError");
  });

  test("includes key in metadata", () => {
    const err = new PreferenceNotFoundError("theme", { actorId: "u1" });
    expect(err.metadata).toMatchObject({ key: "theme", actorId: "u1" });
  });
});

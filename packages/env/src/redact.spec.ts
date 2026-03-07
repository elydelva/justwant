import { describe, expect, test } from "bun:test";
import { redactRecord, redactValue, shouldRedact } from "./redact.js";

describe("shouldRedact", () => {
  test("returns false when redact is undefined", () => {
    expect(shouldRedact("SECRET", undefined)).toBe(false);
  });

  test("returns true when key is in array", () => {
    expect(shouldRedact("API_KEY", ["API_KEY", "PASSWORD"])).toBe(true);
  });

  test("returns false when key is not in array", () => {
    expect(shouldRedact("PUBLIC_URL", ["API_KEY", "PASSWORD"])).toBe(false);
  });

  test("returns true when RegExp matches key", () => {
    expect(shouldRedact("SECRET_KEY", /SECRET|PASSWORD/)).toBe(true);
    expect(shouldRedact("PASSWORD", /SECRET|PASSWORD/)).toBe(true);
  });

  test("returns false when RegExp does not match", () => {
    expect(shouldRedact("PUBLIC", /SECRET|PASSWORD/)).toBe(false);
  });
});

describe("redactValue", () => {
  test("returns REDACTED when redact is true", () => {
    expect(redactValue("sensitive", true)).toBe("[redacted]");
  });

  test("returns original value when redact is false", () => {
    expect(redactValue("sensitive", false)).toBe("sensitive");
  });
});

describe("redactRecord", () => {
  test("returns record as-is when redact is undefined", () => {
    const record = { a: 1, b: "secret" };
    const result = redactRecord(record, undefined);
    expect(result).toEqual(record);
  });

  test("redacts keys in array", () => {
    const record = { API_KEY: "sk-xxx", PUBLIC_URL: "https://example.com" };
    const result = redactRecord(record, ["API_KEY"]);
    expect(result).toEqual({ API_KEY: "[redacted]", PUBLIC_URL: "https://example.com" });
  });

  test("redacts keys matching RegExp", () => {
    const record = { SECRET: "x", PASSWORD: "y", PUBLIC: "z" };
    const result = redactRecord(record, /SECRET|PASSWORD/);
    expect(result).toEqual({ SECRET: "[redacted]", PASSWORD: "[redacted]", PUBLIC: "z" });
  });

  test("preserves non-matching keys", () => {
    const record = { A: 1, B: 2 };
    const result = redactRecord(record, ["C"]);
    expect(result).toEqual({ A: 1, B: 2 });
  });
});

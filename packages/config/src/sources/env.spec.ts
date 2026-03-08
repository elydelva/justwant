import { describe, expect, test } from "bun:test";
import { defineEnvSource } from "./env.js";

describe("defineEnvSource", () => {
  test("get returns value for key", () => {
    const source = defineEnvSource({ env: { DATABASE_URL: "postgres://local" } });
    const value = source.get({ key: "DATABASE_URL" });
    expect(value).toBe("postgres://local");
  });

  test("get returns undefined for missing key", () => {
    const source = defineEnvSource({ env: {} });
    const value = source.get({ key: "MISSING" });
    expect(value).toBeUndefined();
  });

  test("get returns undefined for path lookup (env uses key only)", () => {
    const source = defineEnvSource({ env: { FOO: "bar" } });
    const value = source.get({ path: "foo" });
    expect(value).toBeUndefined();
  });

  test("prefix is applied to key", () => {
    const source = defineEnvSource({ prefix: "APP_", env: { APP_DATABASE_URL: "postgres://app" } });
    const value = source.get({ key: "DATABASE_URL" });
    expect(value).toBe("postgres://app");
  });

  test("returns undefined for empty string value", () => {
    const source = defineEnvSource({ env: { EMPTY: "" } });
    const value = source.get({ key: "EMPTY" });
    expect(value).toBeUndefined();
  });
});

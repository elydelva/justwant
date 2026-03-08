import { describe, expect, test } from "bun:test";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  ConfigValidationError,
  createConfigService,
  defineEnvironment,
  defineValue,
} from "./index.js";
import { defineDatabaseSource, defineEnvSource, defineJsonSource } from "./sources/index.js";

function createMemoryConfigRepo() {
  const store = new Map<string, unknown>();
  return {
    async findOne(where: { key: string }) {
      const value = store.get(where.key);
      return value !== undefined ? { key: where.key, value } : null;
    },
    set(key: string, value: unknown) {
      store.set(key, value);
    },
  };
}

describe("createConfigService", () => {
  test("get returns value from env source", async () => {
    const envSource = defineEnvSource({ env: { DATABASE_URL: "postgres://env" } });
    const prod = defineEnvironment({
      name: "production",
      sources: {
        databaseUrl: defineValue({ from: envSource, key: "DATABASE_URL" }),
      },
    });
    const config = createConfigService({ environments: [prod] });
    const value = await config.get("databaseUrl");
    expect(value).toBe("postgres://env");
  });

  test("get returns value from waterfall (env then json)", async () => {
    const envSource = defineEnvSource({ env: {} });
    const jsonSource = defineJsonSource({ data: { databaseUrl: "postgres://json" } });
    const prod = defineEnvironment({
      name: "production",
      sources: {
        databaseUrl: [
          defineValue({ from: envSource, key: "DATABASE_URL" }),
          defineValue({ from: jsonSource, path: "databaseUrl" }),
        ],
      },
    });
    const config = createConfigService({ environments: [prod] });
    const value = await config.get("databaseUrl");
    expect(value).toBe("postgres://json");
  });

  test("get returns fallback when key not found", async () => {
    const envSource = defineEnvSource({ env: {} });
    const prod = defineEnvironment({
      name: "production",
      sources: { databaseUrl: defineValue({ from: envSource, key: "DATABASE_URL" }) },
    });
    const config = createConfigService({ environments: [prod] });
    const value = await config.get("databaseUrl", "postgres://default");
    expect(value).toBe("postgres://default");
  });

  test("has returns true when key exists", async () => {
    const envSource = defineEnvSource({ env: { API_KEY: "secret" } });
    const prod = defineEnvironment({
      name: "production",
      sources: { apiKey: defineValue({ from: envSource, key: "API_KEY" }) },
    });
    const config = createConfigService({ environments: [prod] });
    expect(await config.has("apiKey")).toBe(true);
  });

  test("has returns false when key does not exist", async () => {
    const envSource = defineEnvSource({ env: {} });
    const prod = defineEnvironment({
      name: "production",
      sources: { apiKey: defineValue({ from: envSource, key: "API_KEY" }) },
    });
    const config = createConfigService({ environments: [prod] });
    expect(await config.has("apiKey")).toBe(false);
  });

  test("get from database source", async () => {
    const repo = createMemoryConfigRepo();
    repo.set("redisUrl", "redis://localhost");
    const dbSource = defineDatabaseSource({ repo });
    const prod = defineEnvironment({
      name: "production",
      sources: { redisUrl: defineValue({ from: dbSource, key: "redisUrl" }) },
    });
    const config = createConfigService({ environments: [prod] });
    const value = await config.get("redisUrl");
    expect(value).toBe("redis://localhost");
  });

  test("throws when no environment configured", () => {
    expect(() => createConfigService({ environments: [] })).toThrow("No environment configured");
  });

  test("validates with schema when provided", async () => {
    const validSchema = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (v: unknown) =>
          typeof v === "string" && v.length > 0
            ? { value: v }
            : { issues: [{ message: "Required" }] },
      },
    };
    const envSource = defineEnvSource({ env: { API_KEY: "secret" } });
    const prod = defineEnvironment({
      name: "production",
      sources: { apiKey: defineValue({ from: envSource, key: "API_KEY" }) },
      schema: { apiKey: validSchema as StandardSchemaV1<unknown, unknown> },
    });
    const config = createConfigService({ environments: [prod] });
    const value = await config.get("apiKey");
    expect(value).toBe("secret");
  });

  test("throws ConfigValidationError when schema validation fails", async () => {
    const strictSchema = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (v: unknown) =>
          v === "valid" ? { value: v } : { issues: [{ message: "Must be 'valid'" }] },
      },
    };
    const envSource = defineEnvSource({ env: { FOO: "invalid" } });
    const prod = defineEnvironment({
      name: "production",
      sources: { foo: defineValue({ from: envSource, key: "FOO" }) },
      schema: { foo: strictSchema as StandardSchemaV1<unknown, unknown> },
    });
    const config = createConfigService({ environments: [prod], validation: { onError: "throw" } });
    await expect(config.get("foo")).rejects.toThrow(ConfigValidationError);
  });

  test("returns fallback when schema validation fails and onError is warn", async () => {
    const strictSchema = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (v: unknown) =>
          v === "valid" ? { value: v } : { issues: [{ message: "Invalid" }] },
      },
    };
    const envSource = defineEnvSource({ env: { FOO: "invalid" } });
    const prod = defineEnvironment({
      name: "production",
      sources: { foo: defineValue({ from: envSource, key: "FOO" }) },
      schema: { foo: strictSchema as StandardSchemaV1<unknown, unknown> },
    });
    const config = createConfigService({
      environments: [prod],
      validation: { onError: "warn" },
    });
    const value = await config.get("foo", "fallback");
    expect(value).toBe("fallback");
  });

  test("get returns undefined when key not in sources and no fallback", async () => {
    const envSource = defineEnvSource({ env: { X: "y" } });
    const prod = defineEnvironment({
      name: "production",
      sources: { x: defineValue({ from: envSource, key: "X" }) },
    });
    const config = createConfigService({ environments: [prod] });
    const value = await config.get("unknownKey");
    expect(value).toBeUndefined();
  });

  test("uses defaultEnvironment when multiple environments", async () => {
    const stagingEnv = defineEnvSource({ env: { DB: "staging-db" } });
    const prodEnv = defineEnvSource({ env: { DB: "prod-db" } });
    const staging = defineEnvironment({
      name: "staging",
      sources: { db: defineValue({ from: stagingEnv, key: "DB" }) },
    });
    const prod = defineEnvironment({
      name: "production",
      sources: { db: defineValue({ from: prodEnv, key: "DB" }) },
    });
    const config = createConfigService({
      environments: [staging, prod],
      defaultEnvironment: "production",
    });
    const value = await config.get("db");
    expect(value).toBe("prod-db");
  });

  test("ConfigValidationError has issues array", async () => {
    const strictSchema = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: () => ({ issues: [{ message: "Bad value" }] }),
      },
    };
    const envSource = defineEnvSource({ env: { FOO: "x" } });
    const prod = defineEnvironment({
      name: "production",
      sources: { foo: defineValue({ from: envSource, key: "FOO" }) },
      schema: { foo: strictSchema as StandardSchemaV1<unknown, unknown> },
    });
    const config = createConfigService({ environments: [prod], validation: { onError: "throw" } });
    try {
      await config.get("foo");
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigValidationError);
      expect((e as ConfigValidationError).issues).toEqual([{ key: "foo", message: "Bad value" }]);
    }
  });
});

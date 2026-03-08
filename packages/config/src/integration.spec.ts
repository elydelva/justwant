import { describe, expect, test } from "bun:test";
/**
 * E2E integration tests — full config flow with env, json (file), and database sources.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createConfigService, defineEnvironment, defineValue } from "./index.js";
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

describe("config integration (env + json file + database)", () => {
  test("full waterfall: env overrides json, json overrides database", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "config-e2e-"));
    const configPath = join(tmpDir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        database: { url: "postgres://json-default" },
        redis: { url: "redis://json" },
        feature: { enabled: true },
      }),
      "utf-8"
    );

    const envSource = defineEnvSource({
      env: {
        DATABASE_URL: "postgres://env-override",
        REDIS_URL: "redis://env",
      },
    });

    const jsonSource = defineJsonSource({ path: configPath, cwd: "/" });

    const repo = createMemoryConfigRepo();
    repo.set("database.url", "postgres://db-default");
    repo.set("feature.enabled", false);
    const dbSource = defineDatabaseSource({ repo });

    const prod = defineEnvironment({
      name: "production",
      sources: {
        databaseUrl: [
          defineValue({ from: envSource, key: "DATABASE_URL" }),
          defineValue({ from: jsonSource, path: "database.url" }),
          defineValue({ from: dbSource, key: "database.url" }),
        ],
        redisUrl: [
          defineValue({ from: envSource, key: "REDIS_URL" }),
          defineValue({ from: jsonSource, path: "redis.url" }),
        ],
        featureEnabled: [
          defineValue({ from: envSource, key: "FEATURE_ENABLED" }),
          defineValue({ from: jsonSource, path: "feature.enabled" }),
          defineValue({ from: dbSource, key: "feature.enabled" }),
        ],
      },
    });

    const config = createConfigService({ environments: [prod] });

    expect(await config.get("databaseUrl")).toBe("postgres://env-override");
    expect(await config.get("redisUrl")).toBe("redis://env");
    expect(await config.get("featureEnabled")).toBe(true);

    expect(await config.has("databaseUrl")).toBe(true);
    expect(await config.has("unknown")).toBe(false);
  });

  test("json loaded from real file path", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "config-json-"));
    const configPath = join(tmpDir, "app.json");
    writeFileSync(
      configPath,
      JSON.stringify({ api: { baseUrl: "https://api.example.com" } }),
      "utf-8"
    );

    const jsonSource = defineJsonSource({ path: configPath, cwd: "/" });
    const prod = defineEnvironment({
      name: "production",
      sources: {
        apiBaseUrl: defineValue({ from: jsonSource, path: "api.baseUrl" }),
      },
    });

    const config = createConfigService({ environments: [prod] });
    expect(await config.get("apiBaseUrl")).toBe("https://api.example.com");
  });

  test("multi-environment with defaultEnvironment", async () => {
    const stagingEnv = defineEnvSource({ env: { APP_ENV: "staging" } });
    const prodEnv = defineEnvSource({ env: { APP_ENV: "production" } });

    const staging = defineEnvironment({
      name: "staging",
      sources: { appEnv: defineValue({ from: stagingEnv, key: "APP_ENV" }) },
    });
    const prod = defineEnvironment({
      name: "production",
      sources: { appEnv: defineValue({ from: prodEnv, key: "APP_ENV" }) },
    });

    const config = createConfigService({
      environments: [staging, prod],
      defaultEnvironment: "staging",
    });

    expect(await config.get("appEnv")).toBe("staging");
  });
});

import { describe, expect, test } from "bun:test";
import { resolveValue } from "./resolve.js";
import { defineDatabaseSource } from "./sources/database.js";
import { defineEnvSource } from "./sources/env.js";
import { defineJsonSource } from "./sources/json.js";

describe("resolveValue", () => {
  test("returns first non-undefined value from waterfall", async () => {
    const envSource = defineEnvSource({ env: {} });
    const jsonSource = defineJsonSource({ data: { databaseUrl: "postgres://local" } });

    const defs = [
      { from: envSource, key: "DATABASE_URL" },
      { from: jsonSource, path: "databaseUrl" },
    ];
    const value = await resolveValue(defs);
    expect(value).toBe("postgres://local");
  });

  test("returns env value when env has it", async () => {
    const envSource = defineEnvSource({ env: { DATABASE_URL: "postgres://env" } });
    const jsonSource = defineJsonSource({ data: { databaseUrl: "postgres://json" } });

    const defs = [
      { from: envSource, key: "DATABASE_URL" },
      { from: jsonSource, path: "databaseUrl" },
    ];
    const value = await resolveValue(defs);
    expect(value).toBe("postgres://env");
  });

  test("returns undefined when no source has value", async () => {
    const envSource = defineEnvSource({ env: {} });
    const defs = [{ from: envSource, key: "MISSING" }];
    const value = await resolveValue(defs);
    expect(value).toBeUndefined();
  });

  test("works with single definition", async () => {
    const envSource = defineEnvSource({ env: { X: "y" } });
    const value = await resolveValue({ from: envSource, key: "X" });
    expect(value).toBe("y");
  });

  test("works with async source (database)", async () => {
    const store = new Map<string, unknown>([["key", "from-db"]]);
    const dbSource = defineDatabaseSource({
      repo: {
        async findOne(where: { key: string }) {
          const v = store.get(where.key);
          return v !== undefined ? { key: where.key, value: v } : null;
        },
      },
    });
    const value = await resolveValue({ from: dbSource, key: "key" });
    expect(value).toBe("from-db");
  });
});

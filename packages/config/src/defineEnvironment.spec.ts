import { describe, expect, test } from "bun:test";
import { defineEnvironment } from "./defineEnvironment.js";
import { defineEnvSource } from "./sources/env.js";

describe("defineEnvironment", () => {
  test("returns environment with name and sources", () => {
    const envSource = defineEnvSource({ env: {} });
    const prod = defineEnvironment({
      name: "production",
      sources: { databaseUrl: { from: envSource, key: "DATABASE_URL" } },
    });
    expect(prod.name).toBe("production");
    expect(prod.sources).toEqual({ databaseUrl: { from: envSource, key: "DATABASE_URL" } });
  });

  test("returns environment with schema when provided", () => {
    const schema = { databaseUrl: {} };
    const envSource = defineEnvSource({ env: {} });
    const prod = defineEnvironment({
      name: "production",
      sources: { databaseUrl: { from: envSource, key: "DATABASE_URL" } },
      schema,
    });
    expect(prod.schema).toEqual(schema);
  });
});

import { describe, expect, test } from "bun:test";
import type { EnvSchema } from "./core.js";
import { defineEnv, getCwd, getNodeEnv } from "./shared.js";

function mockSchema(): EnvSchema {
  return {
    PORT: {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (v) => ({ value: v }),
      },
    },
  };
}

describe("getCwd", () => {
  test("returns a non-empty string in Node/Bun", () => {
    expect(typeof getCwd()).toBe("string");
    expect(getCwd().length).toBeGreaterThan(0);
  });
});

describe("getNodeEnv", () => {
  test("returns a string", () => {
    expect(typeof getNodeEnv()).toBe("string");
  });

  test("returns process.env.NODE_ENV when set", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(getNodeEnv()).toBe("production");
    process.env.NODE_ENV = original;
  });

  test('returns "development" when NODE_ENV is unset', () => {
    const original = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    expect(getNodeEnv()).toBe("development");
    process.env.NODE_ENV = original;
  });
});

describe("defineEnv", () => {
  test("returns vars and clientPrefix", () => {
    const schema = mockSchema();
    const result = defineEnv({ vars: schema, clientPrefix: "NEXT_PUBLIC_" });
    expect(result.vars).toBe(schema);
    expect(result.clientPrefix).toBe("NEXT_PUBLIC_");
  });

  test("clientPrefix is undefined when not provided", () => {
    const result = defineEnv({ vars: mockSchema() });
    expect(result.clientPrefix).toBeUndefined();
  });
});

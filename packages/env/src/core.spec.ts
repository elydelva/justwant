import { describe, expect, test } from "bun:test";
import { createEnvWithDeps } from "./core.js";
import type { CreateEnvDeps, EnvSchema } from "./core.js";
import { EnvironmentError } from "./errors.js";

function mockSchema<T>(
  validate: (v: unknown) => { value?: T; issues?: readonly { message?: string }[] }
) {
  return {
    "~standard": { validate },
  } as EnvSchema[string];
}

describe("createEnvWithDeps", () => {
  const baseDeps: CreateEnvDeps = {
    mergeSources: (_, __, expand) =>
      expand
        ? { FOO: "bar", PORT: "3000", DATABASE_URL: "postgres://localhost" }
        : { FOO: "bar", PORT: "3000", DATABASE_URL: "postgres://localhost" },
    getCwd: () => "/tmp",
    getNodeEnv: () => "test",
  };

  describe("happy path", () => {
    test("validates and exposes vars from mergeSources", () => {
      const deps: CreateEnvDeps = {
        ...baseDeps,
        mergeSources: () => ({ FOO: "bar", PORT: "3000" }),
      };
      const env = createEnvWithDeps(
        {
          vars: {
            FOO: mockSchema((v) => ({ value: v ?? "" })),
            PORT: mockSchema((v) => ({ value: Number(v) || 0 })),
          },
          sources: { inline: {} },
        },
        deps
      );
      expect(env.FOO).toBe("bar");
      expect(env.PORT).toBe(3000);
    });

    test("get returns value for existing key", () => {
      const env = createEnvWithDeps(
        {
          vars: { FOO: mockSchema((v) => ({ value: v ?? "" })) },
          sources: { inline: {} },
        },
        { ...baseDeps, mergeSources: () => ({ FOO: "bar" }) }
      );
      expect(env.get("FOO")).toBe("bar");
    });

    test("get returns fallback when key missing", () => {
      const env = createEnvWithDeps(
        {
          vars: { FOO: mockSchema((v) => ({ value: v ?? "" })) },
          sources: { inline: {} },
        },
        { ...baseDeps, mergeSources: () => ({}) }
      );
      expect(env.get("MISSING", "default")).toBe("default");
    });

    test("has returns true for existing key", () => {
      const env = createEnvWithDeps(
        {
          vars: { FOO: mockSchema((v) => ({ value: v ?? "" })) },
          sources: { inline: {} },
        },
        { ...baseDeps, mergeSources: () => ({ FOO: "x" }) }
      );
      expect(env.has("FOO")).toBe(true);
    });

    test("has returns false for missing key", () => {
      const env = createEnvWithDeps(
        {
          vars: {},
          sources: { inline: {} },
        },
        baseDeps
      );
      expect(env.has("MISSING")).toBe(false);
    });

    test("raw returns raw string value", () => {
      const env = createEnvWithDeps(
        {
          vars: { PORT: mockSchema((v) => ({ value: Number(v) })) },
          sources: { inline: {} },
        },
        { ...baseDeps, mergeSources: () => ({ PORT: "3000" }) }
      );
      expect(env.raw("PORT")).toBe("3000");
    });
  });

  describe("include", () => {
    test("merges vars from include with clientPrefix", () => {
      const env = createEnvWithDeps(
        {
          include: [
            {
              vars: { API_URL: mockSchema((v) => ({ value: v ?? "" })) },
              clientPrefix: "NEXT_PUBLIC_",
            },
          ],
          vars: {},
          sources: { inline: {} },
        },
        {
          ...baseDeps,
          mergeSources: () => ({ NEXT_PUBLIC_API_URL: "https://api.example.com" }),
        }
      );
      expect(env.get("API_URL")).toBe("https://api.example.com");
    });
  });

  describe("groups", () => {
    test("exposes group vars via group.key access", () => {
      const env = createEnvWithDeps(
        {
          vars: {},
          groups: {
            database: {
              url: mockSchema((v) => ({ value: v ?? "" })),
            },
          },
          sources: { inline: {} },
        },
        {
          ...baseDeps,
          mergeSources: () => ({ DATABASE_URL: "postgres://localhost" }),
        }
      );
      expect(env.database).toBeDefined();
      expect((env.database as { url: string }).url).toBe("postgres://localhost");
    });

    test("get with dotted key returns group value", () => {
      const env = createEnvWithDeps(
        {
          vars: {},
          groups: {
            db: { host: mockSchema((v) => ({ value: v ?? "" })) },
          },
          sources: { inline: {} },
        },
        {
          ...baseDeps,
          mergeSources: () => ({ DB_HOST: "localhost" }),
        }
      );
      expect(env.get("db.host")).toBe("localhost");
    });
  });

  describe("validation errors", () => {
    test("throws EnvironmentError when onError is throw and validation fails", () => {
      const envFn = () =>
        createEnvWithDeps(
          {
            vars: {
              FOO: mockSchema(() => ({ issues: [{ message: "Invalid" }] })),
            },
            sources: { inline: {} },
          },
          { ...baseDeps, mergeSources: () => ({ FOO: "bad" }) }
        );
      expect(envFn).toThrow(EnvironmentError);
      try {
        envFn();
      } catch (e) {
        expect((e as EnvironmentError).issues).toHaveLength(1);
        expect((e as EnvironmentError).issues[0]?.message).toBe("Invalid");
      }
    });

    test("skip: true does not throw on validation errors", () => {
      const env = createEnvWithDeps(
        {
          vars: {
            FOO: mockSchema(() => ({ issues: [{ message: "Invalid" }] })),
            BAR: mockSchema((v) => ({ value: v ?? "" })),
          },
          validation: { skip: true },
          sources: { inline: {} },
        },
        { ...baseDeps, mergeSources: () => ({ FOO: "bad", BAR: "ok" }) }
      );
      expect(env.BAR).toBe("ok");
      expect(env.FOO).toBeUndefined();
    });

    test("onError: warn does not throw", () => {
      const env = createEnvWithDeps(
        {
          vars: {
            FOO: mockSchema(() => ({ issues: [{ message: "Invalid" }] })),
            BAR: mockSchema((v) => ({ value: v ?? "" })),
          },
          validation: { onError: "warn" },
          sources: { inline: {} },
        },
        { ...baseDeps, mergeSources: () => ({ FOO: "bad", BAR: "ok" }) }
      );
      expect(env.FOO).toBeUndefined();
      expect(env.BAR).toBe("ok");
    });
  });

  describe("modes", () => {
    test("adds issues for missing mode-required vars", () => {
      const envFn = () =>
        createEnvWithDeps(
          {
            vars: { FOO: mockSchema((v) => ({ value: v ?? "" })) },
            modes: { production: ["DATABASE_URL"] },
            mode: "production",
            sources: { inline: {} },
          },
          { ...baseDeps, mergeSources: () => ({ FOO: "x" }), getNodeEnv: () => "production" }
        );
      expect(envFn).toThrow(EnvironmentError);
    });
  });

  describe("redact", () => {
    test("toJSON redacts keys matching redact config", () => {
      const env = createEnvWithDeps(
        {
          vars: {
            SECRET: mockSchema((v) => ({ value: v ?? "" })),
            PUBLIC: mockSchema((v) => ({ value: v ?? "" })),
          },
          redact: ["SECRET"],
          sources: { inline: {} },
        },
        { ...baseDeps, mergeSources: () => ({ SECRET: "sk-xxx", PUBLIC: "https://example.com" }) }
      );
      const json = env.toJSON();
      expect(json.SECRET).toBe("[redacted]");
      expect(json.PUBLIC).toBe("https://example.com");
    });
  });
});

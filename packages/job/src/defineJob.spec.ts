import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { defineJob } from "./defineJob.js";

describe("defineJob", () => {
  test("creates job definition with id only", () => {
    const job = defineJob({ name: "test" });
    expect(job.name).toBe("test");
    expect("cron" in job).toBe(false);
  });

  test("handler.run executes without schema", async () => {
    const job = defineJob({ name: "test" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });
    await handler.run({});
    expect(ran).toBe(true);
  });

  test("handler.run validates payload with schema", async () => {
    const job = defineJob({
      id: "test",
      schema: v.object({ count: v.number() }),
    });
    const handler = job.handle(async ({ data }) => {
      expect(data.count).toBe(42);
    });
    await handler.run({ count: 42 });
  });

  test("handler.run throws on invalid payload", async () => {
    const job = defineJob({
      id: "test",
      schema: v.object({ count: v.number() }),
    });
    const handler = job.handle(async () => {});
    await expect(handler.run({ count: "not-a-number" })).rejects.toThrow();
  });

  test("handler.run exposes job context (id, runCount, startedAt, logger)", async () => {
    const job = defineJob({ name: "ctx-test" });
    let ctx: unknown;
    const handler = job.handle(async (c) => {
      ctx = c;
    });
    await handler.run({});
    const c = ctx as { job: { id: string; runCount: number; startedAt: Date }; logger: object };
    expect(c.job.name).toBe("ctx-test");
    expect(c.job.runCount).toBe(1);
    expect(c.job.startedAt).toBeInstanceOf(Date);
    expect(typeof c.logger.info).toBe("function");
  });

  test("handler.run with schema fallback path (_run) succeeds for valid payload", async () => {
    // Use a Proxy so ~standard.validate is absent but ~run (valibot internals) still works.
    // This forces validatePayload to take the _run branch → validateWithValibot.
    const real = v.object({ n: v.number() });
    const schema = new Proxy(real, {
      get(target, prop) {
        if (prop === "~standard") return { vendor: "valibot", version: 1 as const };
        if (prop === "_run") return (target as unknown as Record<symbol | string, unknown>)["~run"];
        return (target as unknown as Record<symbol | string, unknown>)[prop as string];
      },
    }) as unknown as import("@standard-schema/spec").StandardSchemaV1;

    const job = defineJob({ name: "valibot-fallback", schema });
    const handler = job.handle(async () => {});
    await expect(handler.run({ n: 42 })).resolves.toBeUndefined();
  });

  test("validateWithValibot throws JobValidationError on invalid payload", async () => {
    const { JobValidationError } = await import("./errors.js");
    const real = v.object({ n: v.number() });
    const schema = new Proxy(real, {
      get(target, prop) {
        if (prop === "~standard") return { vendor: "valibot", version: 1 as const };
        if (prop === "_run") return (target as unknown as Record<symbol | string, unknown>)["~run"];
        return (target as unknown as Record<symbol | string, unknown>)[prop as string];
      },
    }) as unknown as import("@standard-schema/spec").StandardSchemaV1;

    const job = defineJob({ name: "valibot-err", schema });
    const handler = job.handle(async () => {});
    await expect(handler.run({ n: "not-a-number" })).rejects.toThrow(JobValidationError);
  });

  test("validateWithValibot catch re-throws non-JobValidationError as JobValidationError", async () => {
    const { JobValidationError } = await import("./errors.js");
    // Proxy where ~run is undefined so safeParse throws TypeError internally
    const schema = new Proxy({} as ReturnType<typeof v.object>, {
      get(_target, prop) {
        if (prop === "~standard") return { vendor: "test", version: 1 as const };
        if (prop === "_run") return () => {}; // passes the _run function check
        return undefined; // ~run is undefined → safeParse throws TypeError
      },
    }) as unknown as import("@standard-schema/spec").StandardSchemaV1;

    const job = defineJob({ name: "valibot-catch", schema });
    const handler = job.handle(async () => {});
    await expect(handler.run({})).rejects.toThrow(JobValidationError);
  });

  test("async schema validation throws JobValidationError with 'Async validation not supported'", async () => {
    const { JobValidationError } = await import("./errors.js");
    const asyncSchema = {
      "~standard": {
        vendor: "async-test",
        version: 1 as const,
        validate: (val: unknown) => Promise.resolve({ value: val }),
      },
    } as unknown as import("@standard-schema/spec").StandardSchemaV1;

    const job = defineJob({ name: "async-schema", schema: asyncSchema });
    const handler = job.handle(async () => {});
    await expect(handler.run({})).rejects.toThrow(JobValidationError);
    await expect(handler.run({})).rejects.toThrow("Async validation not supported");
  });
});

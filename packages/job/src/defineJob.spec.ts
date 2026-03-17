import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { defineJob } from "./defineJob.js";

describe("defineJob", () => {
  test("creates job definition with id only", () => {
    const job = defineJob({ id: "test" });
    expect(job.id).toBe("test");
    expect("cron" in job).toBe(false);
  });

  test("handler.run executes without schema", async () => {
    const job = defineJob({ id: "test" });
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
});

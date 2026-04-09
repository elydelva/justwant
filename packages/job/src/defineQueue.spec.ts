import { describe, expect, test } from "bun:test";
import { defineJob } from "./defineJob.js";
import { defineQueue } from "./defineQueue.js";

describe("defineQueue", () => {
  test("creates queue with job and cron", () => {
    const job = defineJob({ name: "test" });
    const queue = defineQueue({ job, cron: "0 9 * * *" });
    expect(queue.job).toBe(job);
    expect(queue.cron).toBe("0 9 * * *");
    expect(queue.queue).toBeUndefined();
  });

  test("creates queue with job and queue name", () => {
    const job = defineJob({ name: "test" });
    const queue = defineQueue({ job, queue: "my-queue" });
    expect(queue.job).toBe(job);
    expect(queue.queue).toBe("my-queue");
    expect(queue.cron).toBeUndefined();
  });

  test("creates queue with job and name (alias for queue)", () => {
    const job = defineJob({ name: "test" });
    const queue = defineQueue({ job, name: "my-queue" });
    expect(queue.job).toBe(job);
    expect(queue.queue).toBe("my-queue");
    expect(queue.name).toBe("my-queue");
    expect(queue.cron).toBeUndefined();
  });

  test("creates queue with both cron and queue", () => {
    const job = defineJob({ name: "test" });
    const queue = defineQueue({ job, cron: "0 9 * * *", queue: "scheduled" });
    expect(queue.cron).toBe("0 9 * * *");
    expect(queue.queue).toBe("scheduled");
  });

  test("throws when neither cron nor queue/name provided", () => {
    const job = defineJob({ name: "test" });
    expect(() => defineQueue({ job })).toThrow("at least cron or queue/name");
  });

  test("supports parallelism and aggregateSchedules", () => {
    const job = defineJob({ name: "test" });
    const queue = defineQueue({
      job,
      cron: "* * * * *",
      parallelism: 5,
      aggregateSchedules: true,
    });
    expect(queue.parallelism).toBe(5);
    expect(queue.aggregateSchedules).toBe(true);
  });
});

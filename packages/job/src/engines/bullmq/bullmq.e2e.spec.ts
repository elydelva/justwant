/**
 * E2E tests for BullMQ engine.
 * Requires: Redis (docker compose up -d in packages/job).
 */
import { describe, expect, test } from "bun:test";
import { createJob } from "../../core.js";
import { defineJob } from "../../defineJob.js";
import { defineQueue } from "../../defineQueue.js";
import { hasRedis } from "../../e2e-helpers.js";
import { bullmqEngine } from "./index.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

describe("BullMQ engine E2E", () => {
  test("register and enqueue executes handler", async () => {
    if (!(await hasRedis())) {
      console.log("Skipping BullMQ E2E: Redis not available (run: docker compose up -d)");
      return;
    }

    const jobId = `bullmq-e2e-${Date.now()}`;
    const jobService = createJob({
      engine: bullmqEngine({
        connection: REDIS_URL,
        prefix: `job-e2e-${Date.now()}`,
      }),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: jobId });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });

    await jobService.register(queue, handler);
    await jobService.enqueue(queue.job.id, {});
    expect(ran).toBe(true);

    await jobService.unregister(queue.job.id);
    await jobService.stop();
  });

  test("listQueues returns registered queues", async () => {
    if (!(await hasRedis())) {
      console.log("Skipping BullMQ E2E: Redis not available (run: docker compose up -d)");
      return;
    }

    const jobId = `bullmq-list-${Date.now()}`;
    const jobService = createJob({
      engine: bullmqEngine({
        connection: REDIS_URL,
        prefix: `job-e2e-${Date.now()}`,
      }),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: jobId });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    const handler = job.handle(async () => {});

    await jobService.register(queue, handler);
    const list = await jobService.listQueues();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(jobId);

    await jobService.unregister(queue.job.id);
    await jobService.stop();
  });

  test("unregister removes queue", async () => {
    if (!(await hasRedis())) {
      console.log("Skipping BullMQ E2E: Redis not available (run: docker compose up -d)");
      return;
    }

    const jobId = `bullmq-unreg-${Date.now()}`;
    const jobService = createJob({
      engine: bullmqEngine({
        connection: REDIS_URL,
        prefix: `job-e2e-${Date.now()}`,
      }),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: jobId });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    const handler = job.handle(async () => {});

    await jobService.register(queue, handler);
    expect(await jobService.listQueues()).toHaveLength(1);

    await jobService.unregister(queue.job.id);
    expect(await jobService.listQueues()).toHaveLength(0);

    await jobService.stop();
  });
});

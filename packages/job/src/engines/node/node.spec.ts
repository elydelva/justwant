import { describe, expect, test } from "bun:test";
import { createJob } from "../../core.js";
import { defineJob } from "../../defineJob.js";
import { defineQueue } from "../../defineQueue.js";
import { nodeEngine } from "./index.js";

describe("nodeEngine", () => {
  test("registers and enqueues job", async () => {
    const jobService = createJob({
      engine: nodeEngine(),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: "node-test" });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });
    await jobService.register(queue, handler);
    await jobService.enqueue(queue.job.id);
    expect(ran).toBe(true);
    await jobService.unregister(queue.job.id);
  });

  test("listQueues returns registered queue", async () => {
    const jobService = createJob({
      engine: nodeEngine(),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: "node-list" });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    const handler = job.handle(async () => {});
    await jobService.register(queue, handler);
    const list = await jobService.listQueues();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("node-list");
    await jobService.unregister(queue.job.id);
  });

  test("unregister removes queue from list", async () => {
    const jobService = createJob({
      engine: nodeEngine(),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: "node-unreg" });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    const handler = job.handle(async () => {});
    await jobService.register(queue, handler);
    expect(await jobService.listQueues()).toHaveLength(1);
    await jobService.unregister(queue.job.id);
    expect(await jobService.listQueues()).toHaveLength(0);
  });
});

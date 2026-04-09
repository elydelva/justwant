import { describe, expect, test } from "bun:test";
import { createJob } from "./core.js";
import { defineCron } from "./defineCron.js";
import { defineJob } from "./defineJob.js";
import { defineQueue } from "./defineQueue.js";
import { nodeEngine } from "./engines/node/index.js";
import { createMemoryJobRepository } from "./repo/memory.js";
import type { JobEngineContract, JobHandler, QueueDefinition } from "./types.js";

function createMockEngine(): JobEngineContract & {
  enqueueCalls: { id: string; payload: unknown }[];
} {
  const queues = new Map<string, QueueDefinition>();
  const handlers = new Map<string, JobHandler>();
  const enqueueCalls: { id: string; payload: unknown }[] = [];

  return {
    capabilities: {
      name: "mock",
      hasNativePersistence: false,
      requires: { persistentRuntime: false },
      supports: {
        scheduling: true,
        manualTrigger: true,
        retry: false,
        pauseQueue: false,
        resumeQueue: false,
        getQueueMetadata: false,
        listInstances: false,
        getInstance: false,
        cancelInstance: false,
        retryInstance: false,
        drain: false,
        getJobCounts: false,
      },
    },
    async register(queueDef, handler) {
      const id = queueDef.queue ?? queueDef.job.name;
      queues.set(id, queueDef);
      if (handler) handlers.set(id, handler);
    },
    async handle(queueDef, handler) {
      const id = queueDef.queue ?? queueDef.job.name;
      queues.set(id, queueDef);
      handlers.set(id, handler);
    },
    async unregister(id) {
      queues.delete(id);
      handlers.delete(id);
    },
    async enqueue(id, payload) {
      enqueueCalls.push({ id, payload });
      const h = handlers.get(id);
      if (h) await h.run((payload ?? {}) as never);
    },
    async listQueues() {
      return [...queues.entries()].map(([id, def]) => ({
        id,
        cron: def.cron,
        status: "active" as const,
      }));
    },
    async stats() {
      return { runs: 0, failures: 0 };
    },
    async start() {},
    async stop() {},
    enqueueCalls,
  };
}

describe("createJob", () => {
  test("register and enqueue job with handler", async () => {
    const jobService = createJob({
      engine: createMockEngine(),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ name: "test" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });
    await jobService.register(queue, handler);
    await jobService.enqueue(queue.job.name, {});
    expect(ran).toBe(true);
  });

  test("listQueues returns queues", async () => {
    const jobService = createJob({
      engine: createMockEngine(),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ name: "test" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    await jobService.register(queue);
    const list = await jobService.listQueues();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("test");
  });

  test("dispatch returns 404 for unknown queue", async () => {
    const jobService = createJob({
      engine: createMockEngine(),
      skipRuntimeCheck: true,
    });
    const result = await jobService.dispatch(
      "unknown",
      new Request("http://x", { method: "POST", body: "{}" })
    );
    expect(result.status).toBe(404);
  });

  test("dispatch success parses body and executes handler", async () => {
    const engine = createMockEngine();
    const jobService = createJob({ engine, skipRuntimeCheck: true });
    const job = defineJob({ name: "test" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    let receivedPayload: unknown;
    const handler = job.handle(async ({ data }) => {
      receivedPayload = data;
    });
    await jobService.register(queue, handler);

    const req = new Request("http://x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foo: "bar" }),
    });
    const result = await jobService.dispatch("test", req);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true });
    expect(receivedPayload).toEqual({ foo: "bar" });
  });

  test("handle alone then enqueue executes handler", async () => {
    const engine = createMockEngine();
    const jobService = createJob({ engine, skipRuntimeCheck: true });
    const job = defineJob({ name: "handle-test" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });
    await jobService.handle(queue, handler);
    await jobService.enqueue(queue.job.name);
    expect(ran).toBe(true);
  });

  test("unregister removes queue from list", async () => {
    const engine = createMockEngine();
    const jobService = createJob({ engine, skipRuntimeCheck: true });
    const job = defineJob({ name: "unreg" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    await jobService.register(queue);
    expect(await jobService.listQueues()).toHaveLength(1);
    await jobService.unregister(queue.job.name);
    expect(await jobService.listQueues()).toHaveLength(0);
  });

  test("plugin execution order: beforeExecute, handler, then afterExecute", async () => {
    const order: string[] = [];
    const pluginA = {
      beforeExecute: async (_ctx: unknown, next: () => Promise<void>) => {
        order.push("A.before");
        await next();
      },
      afterExecute: async (_ctx: unknown, next: () => Promise<void>) => {
        await next();
        order.push("A.after");
      },
    };
    const pluginB = {
      beforeExecute: async (_ctx: unknown, next: () => Promise<void>) => {
        order.push("B.before");
        await next();
      },
      afterExecute: async (_ctx: unknown, next: () => Promise<void>) => {
        await next();
        order.push("B.after");
      },
    };
    const jobService = createJob({
      engine: createMockEngine(),
      plugins: [pluginA, pluginB],
      skipRuntimeCheck: true,
    });
    const job = defineJob({ name: "order-test" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    const handler = job.handle(async () => {
      order.push("handler");
    });
    await jobService.register(queue, handler);
    await jobService.enqueue(queue.job.name, {});
    expect(order).toEqual(["A.before", "B.before", "handler", "A.after", "B.after"]);
  });

  test("enqueue without handler calls engine.enqueue", async () => {
    const engine = createMockEngine();
    const jobService = createJob({ engine, skipRuntimeCheck: true });
    const job = defineJob({ name: "scheduler-only" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    await jobService.register(queue);

    await jobService.enqueue(queue.job.name, { x: 1 });

    expect(engine.enqueueCalls).toHaveLength(1);
    expect(engine.enqueueCalls[0]).toEqual({ id: "scheduler-only", payload: { x: 1 } });
  });

  test("trigger (deprecated) works as enqueue alias", async () => {
    const engine = createMockEngine();
    const jobService = createJob({ engine, skipRuntimeCheck: true });
    const job = defineJob({ name: "trigger-test" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });
    await jobService.register(queue, handler);
    await jobService.trigger(queue, {});
    expect(ran).toBe(true);
  });

  test("supports returns capability", () => {
    const engine = createMockEngine();
    const jobService = createJob({ engine, skipRuntimeCheck: true });
    expect(jobService.supports("scheduling")).toBe(true);
    expect(jobService.supports("pauseQueue")).toBe(false);
  });

  test("crons and queues from options register on start", async () => {
    const engine = createMockEngine();
    const job = defineJob({ name: "scheduled-job" });
    const cron = defineCron({ job, cron: "* * * * *" });
    const queue = defineQueue({ job: defineJob({ name: "queue-job" }), name: "my-queue" });
    let cronRan = false;
    let queueRan = false;
    const jobService = createJob({
      engine,
      skipRuntimeCheck: true,
      crons: [cron],
      queues: [queue],
      handlers: {
        "scheduled-job": job.handle(async () => {
          cronRan = true;
        }),
        "queue-job": queue.job.handle(async () => {
          queueRan = true;
        }),
      },
    });
    await jobService.start();
    const list = await jobService.listQueues();
    expect(list).toHaveLength(2);
    await jobService.enqueue("scheduled-job", {});
    await jobService.enqueue(queue, {});
    expect(cronRan).toBe(true);
    expect(queueRan).toBe(true);
  });

  test("enqueue accepts queue object", async () => {
    const engine = createMockEngine();
    const jobService = createJob({ engine, skipRuntimeCheck: true });
    const job = defineJob({ name: "obj-test" });
    const queue = defineQueue({ job, name: "emails" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });
    await jobService.register(queue, handler);
    await jobService.enqueue(queue, {});
    expect(ran).toBe(true);
  });

  test("pauseQueue and resumeQueue accept queue object", async () => {
    const paused = new Map<string, boolean>();
    const engine = createMockEngineWithPause(paused);
    const jobService = createJob({ engine, skipRuntimeCheck: true });
    const job = defineJob({ name: "pause-test" });
    const queue = defineQueue({ job, name: "pausable" });
    await jobService.register(queue);
    await jobService.pauseQueue(queue);
    expect(paused.get("pausable")).toBe(true);
    await jobService.resumeQueue(queue);
    expect(paused.get("pausable")).toBe(false);
  });

  test("skipNext skips next cron execution", async () => {
    const repo = createMemoryJobRepository();
    let runCount = 0;
    const job = defineJob({ name: "skip-test" });
    const cron = defineCron({ job, cron: "* * * * *", id: "skip-cron" });
    const jobService = createJob({
      engine: nodeEngine(),
      repo,
      skipRuntimeCheck: true,
      crons: [cron],
      handlers: {
        "skip-test": job.handle(async () => {
          runCount++;
        }),
      },
    });
    await jobService.start();
    await jobService.skipNext(cron);
    await jobService.enqueue("skip-cron", {});
    expect(runCount).toBe(0);
    await jobService.enqueue("skip-cron", {});
    expect(runCount).toBe(1);
    await jobService.stop();
  });
});

function createMockEngineWithPause(paused: Map<string, boolean>): JobEngineContract {
  const base = createMockEngine();
  return {
    ...base,
    capabilities: {
      ...base.capabilities,
      supports: { ...base.capabilities.supports, pauseQueue: true, resumeQueue: true },
    },
    async pauseQueue(id: string) {
      paused.set(id, true);
    },
    async resumeQueue(id: string) {
      paused.set(id, false);
    },
  };
}

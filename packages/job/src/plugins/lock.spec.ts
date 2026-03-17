import { describe, expect, test } from "bun:test";
import { createLock } from "@justwant/lock";
import type { Lock, LockRepository } from "@justwant/lock";
import { createJob } from "../core.js";
import { defineJob } from "../defineJob.js";
import { defineQueue } from "../defineQueue.js";
import type { JobEngineContract, JobHandler, QueueDefinition } from "../types.js";
import { lockPlugin } from "./lock.js";

function createMemoryRepo(): LockRepository {
  const store = new Map<string, Lock>();
  let idCounter = 0;
  return {
    async findOne(where) {
      for (const lock of store.values()) {
        if (
          (where.lockableKey === undefined || lock.lockableKey === where.lockableKey) &&
          (where.ownerType === undefined || lock.ownerType === where.ownerType) &&
          (where.ownerId === undefined || lock.ownerId === where.ownerId) &&
          (where.ownerOrgId === undefined || (lock.ownerOrgId ?? undefined) === where.ownerOrgId)
        ) {
          return lock;
        }
      }
      return null;
    },
    async findMany(where) {
      return [...store.values()].filter(
        (l) => where.lockableKey === undefined || l.lockableKey === where.lockableKey
      );
    },
    async create(data) {
      const id = `lock_${++idCounter}`;
      const lock: Lock = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.set(id, lock);
      return lock;
    },
    async update(id, data) {
      const existing = store.get(id);
      if (!existing) throw new Error("Not found");
      const updated = { ...existing, ...data, updatedAt: new Date() };
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      store.delete(id);
    },
  };
}

function createMockEngine(): JobEngineContract {
  const queues = new Map<string, QueueDefinition>();
  const handlers = new Map<string, JobHandler>();
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
      const id = queueDef.queue ?? queueDef.job.id;
      queues.set(id, queueDef);
      if (handler) handlers.set(id, handler);
    },
    async unregister(id) {
      queues.delete(id);
      handlers.delete(id);
    },
    async enqueue(id, payload) {
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
  };
}

describe("lockPlugin", () => {
  test("handler runs when lock is acquired", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const jobService = createJob({
      engine: createMockEngine(),
      plugins: [lockPlugin({ lock })],
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: "lock-test" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });
    await jobService.register(queue, handler);
    await jobService.enqueue(queue.job.id);
    expect(ran).toBe(true);
  });

  test("handler does not run when lock is not acquired", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const owner1 = { type: "job" as const, id: "instance-1" };
    const owner2 = { type: "job" as const, id: "instance-2" };

    const jobService2 = createJob({
      engine: createMockEngine(),
      plugins: [lockPlugin({ lock, owner: owner2 })],
      skipRuntimeCheck: true,
    });

    const job = defineJob({ id: "contended" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    let runs = 0;
    const handler = job.handle(async () => {
      runs++;
    });

    await jobService2.handle(queue, handler);

    // Hold lock as owner1. When jobService2 triggers, it uses owner2 and cannot acquire.
    const acquired = await lock.acquire(owner1, { type: "job", key: "job:contended" });
    expect(acquired).toBe(true);

    await jobService2.trigger(queue);
    expect(runs).toBe(0);

    await lock.release(owner1, { type: "job", key: "job:contended" });
  });

  test("release is called after handler runs", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const jobService = createJob({
      engine: createMockEngine(),
      plugins: [lockPlugin({ lock })],
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: "release-test" });
    const queue = defineQueue({ job, cron: "* * * * *" });
    const handler = job.handle(async () => {});
    await jobService.register(queue, handler);
    await jobService.trigger(queue);

    const locks = await repo.findMany({ lockableKey: "job:release-test" });
    expect(locks).toHaveLength(0);
  });
});

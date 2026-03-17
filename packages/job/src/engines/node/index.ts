/**
 * @justwant/job — node-cron engine
 * In-process scheduling. No Redis, no persistence. Dev local, simple apps.
 * pauseQueue/resumeQueue via repo when provided to createJob.
 */

import { createRequire } from "node:module";
import type {
  JobEngineContract,
  JobHandler,
  JobStats,
  QueueDefinition,
  QueueStatus,
} from "../../types.js";
import { defineEngine } from "../index.js";

const require = createRequire(import.meta.url);

export interface NodeEngineOptions {
  timezone?: string;
}

interface ScheduledTask {
  start(): void;
  stop(): void;
  destroy?(): void;
}

interface NodeCronModule {
  schedule(
    expression: string,
    fn: () => void | Promise<void>,
    options?: { timezone?: string }
  ): ScheduledTask;
  validate(expression: string): boolean;
}

function queueId(def: QueueDefinition): string {
  return def.queue ?? def.job.id;
}

export function nodeEngine(options: NodeEngineOptions = {}): JobEngineContract {
  let nodeCron: NodeCronModule;
  try {
    nodeCron = require("node-cron");
  } catch {
    throw new Error("node-cron is required for nodeEngine. Install it: bun add node-cron");
  }

  const tasks = new Map<string, ScheduledTask>();
  const handlers = new Map<string, JobHandler>();
  const definitions = new Map<string, QueueDefinition>();
  const runCounts = new Map<string, number>();
  const lastRuns = new Map<string, Date>();

  function scheduleJob(def: QueueDefinition, handler: JobHandler): void {
    const id = queueId(def);
    const cron = def.cron;
    if (!cron) {
      throw new Error(`Queue ${id} needs cron for node engine`);
    }

    const existing = tasks.get(id);
    if (existing) {
      existing.destroy?.();
      tasks.delete(id);
    }

    if (!nodeCron.validate(cron)) {
      throw new Error(`Invalid cron expression: ${cron}`);
    }

    const task = nodeCron.schedule(
      cron,
      async () => {
        const count = (runCounts.get(id) ?? 0) + 1;
        runCounts.set(id, count);
        lastRuns.set(id, new Date());
        await handler.run({});
      },
      { timezone: options.timezone ?? def.job.defaults?.timezone }
    );

    tasks.set(id, task);
  }

  const capabilities: JobEngineContract["capabilities"] = {
    name: "node",
    hasNativePersistence: false,
    requiresRepo: true,
    requires: {
      persistentRuntime: true,
      tcpConnection: false,
      unlimitedDuration: true,
    },
    supports: {
      scheduling: true,
      manualTrigger: true,
      retry: false,
      delay: false,
      priority: false,
      concurrency: false,
      pauseQueue: true,
      resumeQueue: true,
      getQueueMetadata: false,
      listInstances: false,
      getInstance: false,
      cancelInstance: false,
      retryInstance: false,
      drain: false,
      getJobCounts: false,
    },
  };

  const engine: JobEngineContract = {
    capabilities,

    async register(queueDef: QueueDefinition, handler?: JobHandler): Promise<void> {
      const id = queueId(queueDef);
      definitions.set(id, queueDef);
      if (handler) {
        handlers.set(id, handler);
        await scheduleJob(queueDef, handler);
      }
    },

    async handle(queueDef: QueueDefinition, handler: JobHandler): Promise<void> {
      const id = queueId(queueDef);
      handlers.set(id, handler);
      definitions.set(id, queueDef);
      await scheduleJob(queueDef, handler);
    },

    async unregister(id: string): Promise<void> {
      const task = tasks.get(id);
      if (task) {
        task.stop();
        if (typeof task.destroy === "function") task.destroy();
        tasks.delete(id);
      }
      handlers.delete(id);
      definitions.delete(id);
      runCounts.delete(id);
      lastRuns.delete(id);
    },

    async enqueue(id: string, payload?: unknown): Promise<void> {
      const handler = handlers.get(id);
      if (!handler) {
        throw new Error(`Job not found: ${id}`);
      }
      const count = (runCounts.get(id) ?? 0) + 1;
      runCounts.set(id, count);
      lastRuns.set(id, new Date());
      await handler.run((payload ?? {}) as never);
    },

    async listQueues(): Promise<QueueStatus[]> {
      const result: QueueStatus[] = [];
      for (const [id, def] of definitions) {
        result.push({
          id,
          cron: def.cron,
          lastRun: lastRuns.get(id),
          status: tasks.has(id) ? "active" : "unknown",
        });
      }
      return result;
    },

    async stats(id: string): Promise<JobStats> {
      const runs = runCounts.get(id) ?? 0;
      return {
        runs,
        failures: 0,
        lastRun: lastRuns.get(id),
      };
    },

    async start(): Promise<void> {
      for (const task of tasks.values()) {
        task.start();
      }
    },

    async stop(): Promise<void> {
      for (const task of tasks.values()) {
        task.stop();
      }
    },
  };

  return defineEngine(engine);
}

/**
 * @justwant/job — BullMQ engine
 * Redis-based scheduling. Retry, backoff, concurrency. Production standard.
 */

import { createRequire } from "node:module";
import type {
  InstanceStatus,
  JobCounts,
  JobEngineContract,
  JobHandler,
  JobInstance,
  JobStats,
  QueueDefinition,
  QueueMetadata,
  QueueStatus,
} from "../../types.js";
import { defineEngine } from "../index.js";

const require = createRequire(import.meta.url);

export interface BullMQEngineOptions {
  connection: { host?: string; port?: number; url?: string } | string;
  concurrency?: number;
  prefix?: string;
}

interface Queue {
  upsertJobScheduler(
    id: string,
    repeatOpts: { pattern?: string; every?: number; tz?: string },
    jobTemplate?: { data?: unknown; name?: string; opts?: { attempts?: number; backoff?: unknown } }
  ): Promise<{ id?: string }>;
  removeJobScheduler(id: string): Promise<void>;
  add(name: string, data: unknown, opts?: { jobId?: string }): Promise<{ id?: string }>;
  getJobSchedulers(): Promise<Array<{ id: string; pattern?: string }>>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getJobCounts(): Promise<{
    waiting?: number;
    active?: number;
    delayed?: number;
    failed?: number;
    completed?: number;
  }>;
  getJobs(types: string[]): Promise<
    Array<{
      id?: string;
      data?: unknown;
      timestamp?: number;
      failedReason?: string;
      getState?(): Promise<string>;
    }>
  >;
  getJob(
    id: string
  ): Promise<{ id?: string; remove(): Promise<void>; retry(): Promise<void> } | null>;
  drain(delay?: number): Promise<void>;
  close(): Promise<void>;
}

interface Worker {
  close(): Promise<void>;
}

function queueId(def: QueueDefinition): string {
  return def.queue ?? def.job.name;
}

function toInstanceStatus(bullStatus: string): InstanceStatus {
  const m: Record<string, InstanceStatus> = {
    waiting: "waiting",
    active: "active",
    delayed: "delayed",
    failed: "failed",
    completed: "completed",
  };
  return m[bullStatus] ?? "waiting";
}

export function bullmqEngine(options: BullMQEngineOptions): JobEngineContract {
  let QueueClass: new (name: string, opts: { connection: unknown; prefix?: string }) => Queue;
  let WorkerClass: new (
    name: string,
    processor: (job: { id?: string; data: unknown }) => Promise<void>,
    opts: { connection: unknown; concurrency?: number; prefix?: string }
  ) => Worker;

  try {
    const bullmq = require("bullmq");
    QueueClass = bullmq.Queue;
    WorkerClass = bullmq.Worker;
  } catch {
    throw new Error("bullmq is required for bullmqEngine. Install it: bun add bullmq ioredis");
  }

  const { connection, concurrency = 1, prefix = "job" } = options;
  const queues = new Map<string, Queue>();
  const workers = new Map<string, Worker>();
  const definitions = new Map<string, QueueDefinition>();

  function getQueue(id: string): Queue {
    let q = queues.get(id);
    if (!q) {
      q = new QueueClass(id, { connection, prefix });
      queues.set(id, q);
    }
    return q;
  }

  const capabilities: JobEngineContract["capabilities"] = {
    name: "bullmq",
    hasNativePersistence: true,
    requires: {
      persistentRuntime: true,
      tcpConnection: true,
      unlimitedDuration: true,
    },
    supports: {
      scheduling: true,
      manualTrigger: true,
      retry: true,
      delay: true,
      priority: true,
      concurrency: true,
      pauseQueue: true,
      resumeQueue: true,
      getQueueMetadata: true,
      listInstances: true,
      getInstance: true,
      cancelInstance: true,
      retryInstance: true,
      drain: true,
      getJobCounts: true,
    },
  };

  const engine: JobEngineContract = {
    capabilities,

    async register(queueDef: QueueDefinition, handler?: JobHandler): Promise<void> {
      const id = queueId(queueDef);
      definitions.set(id, queueDef);

      const queue = getQueue(id);
      const cron = queueDef.cron;
      if (cron) {
        const cronExpr = cron.includes(" ") ? cron : `0 ${cron}`;
        const tz = queueDef.job.defaults?.timezone;
        const repeatOpts = tz ? { pattern: cronExpr, tz } : { pattern: cronExpr };
        const jobTemplate = {
          data: {},
          name: queueDef.job.name,
          opts: {
            attempts: queueDef.job.defaults?.retry?.attempts ?? 3,
            backoff:
              queueDef.job.defaults?.retry?.backoff === "exponential"
                ? { type: "exponential" as const, delay: 1000 }
                : undefined,
          },
        };
        await queue.upsertJobScheduler(id, repeatOpts, jobTemplate);
      }

      if (handler && WorkerClass) {
        const existingWorker = workers.get(id);
        if (existingWorker) {
          await existingWorker.close();
          workers.delete(id);
        }
        const worker = new WorkerClass(
          id,
          async (bullJob) => {
            await handler.run((bullJob?.data ?? {}) as never);
          },
          { connection, concurrency, prefix }
        );
        workers.set(id, worker);
      }
    },

    async handle(queueDef: QueueDefinition, handler: JobHandler): Promise<void> {
      const id = queueId(queueDef);
      definitions.set(id, queueDef);

      const existingWorker = workers.get(id);
      if (existingWorker) {
        await existingWorker.close();
        workers.delete(id);
      }

      const worker = new WorkerClass(
        id,
        async (bullJob) => {
          await handler.run((bullJob?.data ?? {}) as never);
        },
        { connection, concurrency, prefix }
      );
      workers.set(id, worker);
    },

    async unregister(id: string): Promise<void> {
      const queue = queues.get(id);
      if (queue) {
        await queue.removeJobScheduler(id);
        await queue.close();
        queues.delete(id);
      }
      const worker = workers.get(id);
      if (worker) {
        await worker.close();
        workers.delete(id);
      }
      definitions.delete(id);
    },

    async enqueue(id: string, payload?: unknown): Promise<void> {
      const queue = getQueue(id);
      await queue.add(id, payload ?? {});
    },

    async listQueues(): Promise<QueueStatus[]> {
      const result: QueueStatus[] = [];
      for (const [jobId, def] of definitions) {
        const queue = queues.get(jobId);
        let status: QueueStatus["status"] = "unknown";
        if (queue) {
          try {
            const schedulers = await queue.getJobSchedulers();
            status = schedulers.some((s) => s.id === jobId) ? "active" : "unknown";
          } catch {
            status = "unknown";
          }
        }
        result.push({
          id: jobId,
          cron: def.cron,
          status,
        });
      }
      return result;
    },

    async stats(id: string): Promise<JobStats> {
      return {
        runs: 0,
        failures: 0,
      };
    },

    async start(): Promise<void> {
      // Workers start automatically
    },

    async stop(): Promise<void> {
      for (const worker of workers.values()) {
        await worker.close();
      }
      workers.clear();
      for (const queue of queues.values()) {
        await queue.close();
      }
      queues.clear();
    },

    async pauseQueue(id: string): Promise<void> {
      const queue = getQueue(id);
      await queue.pause();
    },

    async resumeQueue(id: string): Promise<void> {
      const queue = getQueue(id);
      await queue.resume();
    },

    async getQueueMetadata(id: string): Promise<QueueMetadata> {
      const queue = getQueue(id);
      const counts = await queue.getJobCounts();
      return {
        queueId: id,
        paused: false,
        lag: (counts.waiting ?? 0) + (counts.delayed ?? 0),
      };
    },

    async listInstances(id: string, status?: InstanceStatus): Promise<JobInstance[]> {
      const queue = getQueue(id);
      const types = status ? [status] : ["waiting", "active", "delayed", "failed", "completed"];
      const jobs = await queue.getJobs(types);
      const result: JobInstance[] = [];
      for (const j of jobs) {
        const s = (await j.getState?.()) ?? types[0] ?? "waiting";
        result.push({
          id: String(j.id ?? ""),
          queueId: id,
          status: toInstanceStatus(s),
          payload: j.data,
          createdAt: j.timestamp ? new Date(j.timestamp) : undefined,
          failedReason: j.failedReason,
        });
      }
      return result;
    },

    async getInstance(id: string, instanceId: string): Promise<JobInstance | null> {
      const queue = getQueue(id);
      const job = await queue.getJob(instanceId);
      if (!job) return null;
      return {
        id: String(job.id ?? ""),
        queueId: id,
        status: "active",
        payload: {},
      };
    },

    async cancelInstance(id: string, instanceId: string): Promise<void> {
      const queue = getQueue(id);
      const job = await queue.getJob(instanceId);
      if (job) await job.remove();
    },

    async retryInstance(id: string, instanceId: string): Promise<void> {
      const queue = getQueue(id);
      const job = await queue.getJob(instanceId);
      if (job) await job.retry();
    },

    async drain(id: string): Promise<void> {
      const queue = getQueue(id);
      await queue.drain();
    },

    async getJobCounts(id: string): Promise<JobCounts> {
      const queue = getQueue(id);
      return queue.getJobCounts();
    },
  };

  return defineEngine(engine);
}

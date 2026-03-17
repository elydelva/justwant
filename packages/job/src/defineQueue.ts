/**
 * @justwant/job — defineQueue
 * Defines how a job executes: cron, queue name, parallelism.
 */

import type { JobDefinition, QueueDefinition } from "./types.js";

export interface DefineQueueConfig<T = unknown> {
  job: JobDefinition<T>;
  cron?: string;
  /** Queue name. Alias: name. */
  queue?: string;
  /** Alias for queue. */
  name?: string;
  parallelism?: number;
  aggregateSchedules?: boolean;
}

/**
 * Define queue params for a job. At least cron or queue/name (or both) required.
 * Use with createJob({ queues: [defineQueue(...)] }) or register(queueDef, handler).
 */
export function defineQueue<T = unknown>(config: DefineQueueConfig<T>): QueueDefinition<T> {
  const { job, cron, queue, name, parallelism, aggregateSchedules } = config;
  const queueName = queue ?? name;
  if (!cron && !queueName) {
    throw new Error("defineQueue must have at least cron or queue/name");
  }
  return {
    job,
    cron,
    queue: queueName,
    name: queueName,
    parallelism,
    aggregateSchedules,
  };
}

export type { QueueDefinition };

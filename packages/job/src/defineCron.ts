/**
 * @justwant/job — defineCron
 * Defines a scheduled job (cron only, no enqueue).
 */

import type { CronDefinition, JobDefinition } from "./types.js";

export interface DefineCronConfig<T = unknown> {
  job: JobDefinition<T>;
  cron: string;
  /** Unique id (default: job.id). Allows multiple crons for same job. */
  id?: string;
}

/**
 * Define a cron — scheduled only, no enqueue.
 * Use with createJob({ crons: [defineCron(...)] }).
 */
export function defineCron<T = unknown>(config: DefineCronConfig<T>): CronDefinition<T> {
  const { job, cron, id } = config;
  return {
    job,
    cron,
    id,
  };
}

export type { CronDefinition } from "./types.js";

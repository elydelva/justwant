/**
 * @justwant/job — Unified job service
 */

export { createJob } from "./core.js";
export type { JobService, JobOrId, DispatchRequest, DispatchResult } from "./core.js";
export { defineJob } from "./defineJob.js";
export type { DefineJobConfig, InferJobPayload } from "./defineJob.js";
export { defineCron } from "./defineCron.js";
export type { DefineCronConfig, CronDefinition } from "./defineCron.js";
export { defineQueue } from "./defineQueue.js";
export type { DefineQueueConfig, QueueDefinition } from "./defineQueue.js";
export { detectRuntime, checkEngineCompatibility } from "./runtime.js";
export type { RuntimeEnv } from "./runtime.js";
export {
  JobError,
  EngineIncompatibleError,
  JobNotFoundError,
  JobValidationError,
  UnsupportedCapabilityError,
} from "./errors.js";
export type {
  JobEngineContract,
  JobDefinition,
  JobHandler,
  JobStatus,
  QueueStatus,
  JobStats,
  JobDefaults,
  JobLogger,
  JobPlugin,
  JobRepository,
  CreateJobOptions,
  RetryConfig,
  JobInstance,
  QueueMetadata,
  JobCounts,
  InstanceStatus,
} from "./types.js";

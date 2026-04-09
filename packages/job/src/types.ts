/**
 * @justwant/job — Core types
 */

import type { Definable } from "@justwant/meta";
import type { StandardSchemaV1 } from "@standard-schema/spec";

/** Retry configuration for job execution. */
export interface RetryConfig {
  attempts?: number;
  backoff?: "linear" | "exponential" | "fixed";
  delayMs?: number;
}

/** Default options for a job (timezone, retry, timeout). */
export interface JobDefaults {
  timezone?: string;
  retry?: RetryConfig;
  timeout?: string;
}

/** Schema for job payload validation. Uses Standard Schema for valibot/zod compatibility. */
export type JobSchema<T = unknown> = StandardSchemaV1<unknown, T>;

/** Definition of work — extends Definable<N>. Callable: job(instanceId) → { type: N; id: instanceId }. */
export interface JobDefinition<N extends string = string, T = unknown> extends Definable<N> {
  readonly name: N;
  readonly schema?: JobSchema<T>;
  readonly defaults?: JobDefaults;
}

/** Cron definition — scheduled only, no enqueue. */
export interface CronDefinition<T = unknown> {
  readonly job: JobDefinition<string, T>;
  readonly cron: string;
  /** Unique id (default: job.name). Allows multiple crons for same job. */
  readonly id?: string;
}

/** Queue definition — how a job executes (cron, queue name, parallelism). */
export interface QueueDefinition<T = unknown> {
  readonly job: JobDefinition<string, T>;
  readonly cron?: string;
  readonly queue?: string;
  /** Alias for queue. */
  readonly name?: string;
  readonly parallelism?: number;
  readonly aggregateSchedules?: boolean;
}

/** Context passed to job handler. */
export interface JobHandlerContext<T = unknown> {
  data: T;
  job: {
    name: string;
    runCount: number;
    startedAt: Date;
  };
  logger: JobLogger;
}

/** Minimal logger interface for job handlers. */
export interface JobLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/** Handler function for a job. */
export type JobHandlerFn<T = unknown> = (ctx: JobHandlerContext<T>) => Promise<void>;

/** Handler with .run() for isolated testing. */
export interface JobHandler<T = unknown> {
  run(payload: T): Promise<void>;
}

/** Status of a registered queue. */
export interface QueueStatus {
  id: string;
  cron?: string;
  lastRun?: Date;
  nextRun?: Date;
  status: "active" | "paused" | "failed" | "unknown";
}

/** @deprecated Use QueueStatus. */
export type JobStatus = QueueStatus;

/** Stats for a job (runs, failures, avg duration). */
export interface JobStats {
  runs: number;
  failures: number;
  avgDurationMs?: number;
  lastRun?: Date;
  nextRun?: Date;
}

/** Instance status — one execution (waiting/active/delayed/failed/completed). */
export type InstanceStatus = "waiting" | "active" | "delayed" | "failed" | "completed";

/** A concrete job instance (message in queue). */
export interface JobInstance {
  id: string;
  queueId: string;
  status: InstanceStatus;
  payload?: unknown;
  createdAt?: Date;
  processedOn?: Date;
  failedReason?: string;
}

/** Queue metadata (lag, paused, parallelism). */
export interface QueueMetadata {
  queueId: string;
  paused: boolean;
  lag?: number;
  parallelism?: number;
}

/** Job counts by status. */
export interface JobCounts {
  waiting?: number;
  active?: number;
  delayed?: number;
  failed?: number;
  completed?: number;
}

/** Engine capabilities — what the engine requires and supports. */
export interface EngineCapabilities {
  name: string;
  hasNativePersistence: boolean;
  requiresRepo?: boolean;
  requires: {
    persistentRuntime?: boolean;
    tcpConnection?: boolean;
    unlimitedDuration?: boolean;
  };
  supports: {
    scheduling: boolean;
    manualTrigger: boolean;
    retry: boolean;
    delay?: boolean;
    priority?: boolean;
    concurrency?: boolean;
    pauseQueue: boolean;
    resumeQueue: boolean;
    getQueueMetadata: boolean;
    listInstances: boolean;
    getInstance: boolean;
    cancelInstance: boolean;
    retryInstance: boolean;
    drain: boolean;
    getJobCounts: boolean;
    getMetrics?: boolean;
    aggregateSchedules?: boolean;
    queueEnqueue?: boolean;
  };
}

/** Minimal contract an engine must implement. */
export interface JobEngineContract {
  readonly capabilities: EngineCapabilities;

  /** Register queue for scheduling. Handler optional — when provided, engine can run it. */
  register(queueDef: QueueDefinition, handler?: JobHandler): Promise<void>;
  /** Attach handler for worker-only mode. */
  handle?(queueDef: QueueDefinition, handler: JobHandler): Promise<void>;
  unregister(id: string): Promise<void>;
  /** Enqueue a job instance (manual trigger). */
  enqueue(id: string, payload?: unknown): Promise<void>;
  listQueues(): Promise<QueueStatus[]>;
  stats(id: string): Promise<JobStats>;
  start(): Promise<void>;
  stop(): Promise<void>;

  // Optional — capability-checked
  pauseQueue?(id: string): Promise<void>;
  resumeQueue?(id: string): Promise<void>;
  getQueueMetadata?(id: string): Promise<QueueMetadata>;
  listInstances?(id: string, status?: InstanceStatus): Promise<JobInstance[]>;
  getInstance?(id: string, instanceId: string): Promise<JobInstance | null>;
  cancelInstance?(id: string, instanceId: string): Promise<void>;
  retryInstance?(id: string, instanceId: string): Promise<void>;
  drain?(id: string, opts?: { status?: InstanceStatus }): Promise<void>;
  getJobCounts?(id: string): Promise<JobCounts>;
}

/** Internal queue registration with handler attached. */
export interface RegisteredQueue<T = unknown> {
  definition: QueueDefinition<T>;
  handler?: JobHandler<T>;
}

/** Plugin context passed during init. */
export interface JobPluginContext {
  setContext?(key: string, value: unknown): void;
}

/** Plugin hook — wraps handler execution. */
export type JobPluginExecuteFn<T = unknown> = (
  ctx: { jobId: string; payload: T; handler: JobHandler<T> },
  next: () => Promise<void>
) => Promise<void>;

/** Plugin interface. */
export interface JobPlugin {
  init?(context: JobPluginContext): void;
  beforeExecute?: JobPluginExecuteFn;
  afterExecute?: JobPluginExecuteFn;
  onError?: (ctx: { jobId: string; error: unknown }) => Promise<void>;
}

/** Skip next until: Date = skip until date, "once" = skip next tick only. */
export type SkipNextUntil = Date | "once" | null;

/** Repository for job definitions and pause state (used by node engine when no native persistence). */
export interface JobRepository {
  getDefinition(id: string): Promise<JobDefinition | null>;
  listDefinitions(): Promise<JobDefinition[]>;
  saveDefinition(def: JobDefinition): Promise<void>;
  deleteDefinition(id: string): Promise<void>;
  getPaused(id: string): Promise<boolean>;
  setPaused(id: string, paused: boolean): Promise<void>;
  getStats?(id: string): Promise<JobStats>;
  incrementRuns?(id: string): Promise<void>;
  incrementFailures?(id: string): Promise<void>;
  /** Skip next cron tick(s). "once" = skip next, Date = skip until. */
  getSkipNextUntil?(id: string): Promise<SkipNextUntil>;
  setSkipNextUntil?(id: string, value: SkipNextUntil): Promise<void>;
}

/** Options for createJob. */
export interface CreateJobOptions {
  engine: JobEngineContract;
  repo?: JobRepository;
  plugins?: JobPlugin[];
  defaults?: JobDefaults;
  /** Skip runtime compatibility check (e.g. for testing). */
  skipRuntimeCheck?: boolean;
  /** Crons: scheduled only, no enqueue. */
  crons?: CronDefinition[];
  /** Queues: enqueue, pause, etc. */
  queues?: QueueDefinition[];
  /** Handlers by job.id (required for crons and queues with handler). */
  handlers?: Record<string, JobHandler>;
}

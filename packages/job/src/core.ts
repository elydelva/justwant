/**
 * @justwant/job — createJob
 * Orchestrates engines and plugins for unified job API.
 */

import { JobNotFoundError, UnsupportedCapabilityError } from "./errors.js";
import { checkEngineCompatibility } from "./runtime.js";
import type {
  CreateJobOptions,
  CronDefinition,
  InstanceStatus,
  JobCounts,
  JobDefinition,
  JobEngineContract,
  JobHandler,
  JobInstance,
  JobStats,
  QueueDefinition,
  QueueMetadata,
  QueueStatus,
  RegisteredQueue,
  SkipNextUntil,
} from "./types.js";

/** Request-like type for dispatch (Web Request or Node IncomingMessage). */
export type DispatchRequest = Request | { body?: unknown; [key: string]: unknown };

/** Job, cron, queue, or string id — accepted by most service methods. */
export type JobOrId = JobDefinition | CronDefinition | QueueDefinition | string;

function resolveId(x: JobOrId): string {
  if (typeof x === "string") return x;
  if ("queue" in x || "name" in x)
    return (
      (x as QueueDefinition).queue ?? (x as QueueDefinition).name ?? (x as QueueDefinition).job.id
    );
  if ("cron" in x) return (x as CronDefinition).id ?? (x as CronDefinition).job.id;
  return (x as JobDefinition).id;
}

export interface JobService {
  register(queueDef: QueueDefinition, handler?: JobHandler): Promise<void>;
  handle(queueDef: QueueDefinition, handler: JobHandler): Promise<void>;
  unregister(jobOrCronOrQueueOrId: JobOrId): Promise<void>;
  enqueue(jobOrQueueOrId: JobOrId, payload?: unknown): Promise<void>;
  /** @deprecated Use enqueue. */
  trigger(jobOrId: QueueDefinition | string, payload?: unknown): Promise<void>;
  listQueues(): Promise<QueueStatus[]>;
  /** @deprecated Use listQueues. */
  list(): Promise<QueueStatus[]>;
  getStats(jobOrQueueOrId: JobOrId): Promise<JobStats>;
  /** @deprecated Use getStats. */
  stats(jobOrQueueOrId: JobOrId): Promise<JobStats>;
  dispatch(queueId: string, req: DispatchRequest, body?: unknown): Promise<DispatchResult>;
  start(): Promise<void>;
  stop(): Promise<void>;
  supports(operation: keyof JobEngineContract["capabilities"]["supports"]): boolean;
  pauseQueue(jobOrQueueOrId: JobOrId): Promise<void>;
  resumeQueue(jobOrQueueOrId: JobOrId): Promise<void>;
  skipNext(cronOrId: CronDefinition | string): Promise<void>;
  skipUntil(cronOrId: CronDefinition | string, until: Date): Promise<void>;
  disableCron(cronOrId: CronDefinition | string): Promise<void>;
  enableCron(cronOrId: CronDefinition | string): Promise<void>;
  getQueueMetadata?(id: string): Promise<QueueMetadata>;
  listInstances?(id: string, status?: InstanceStatus): Promise<JobInstance[]>;
  getInstance?(id: string, instanceId: string): Promise<JobInstance | null>;
  cancelInstance?(id: string, instanceId: string): Promise<void>;
  retryInstance?(id: string, instanceId: string): Promise<void>;
  drain?(id: string, opts?: { status?: InstanceStatus }): Promise<void>;
  getJobCounts?(id: string): Promise<JobCounts>;
  readonly _internal: {
    engine: JobEngineContract;
    queues: Map<string, RegisteredQueue>;
  };
}

export interface DispatchResult {
  status: number;
  body?: unknown;
  error?: string;
}

async function parseBody(req: DispatchRequest): Promise<unknown> {
  if (req instanceof Request) {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return req.json();
    }
    const text = await req.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }
  const r = req as { body?: unknown; url?: string };
  if (r.body !== undefined) return r.body;
  return {};
}

function validatePayloadWithSchema<T>(
  schema: QueueDefinition<T>["job"]["schema"],
  value: unknown,
  jobId: string
): T {
  if (!schema) return (value ?? {}) as T;
  const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })["~standard"];
  if (!std?.validate) return (value ?? {}) as T;
  const result = std.validate(value);
  if (result && typeof (result as Promise<unknown>).then === "function") {
    throw new Error("Async validation not supported");
  }
  const r = result as { value?: T; issues?: readonly { message?: string; path?: string }[] };
  if (r.issues?.length) {
    throw new Error(
      `Validation failed: ${(r.issues as { message?: string }[]).map((i) => i.message).join(", ")}`
    );
  }
  return (r.value ?? value ?? {}) as T;
}

function queueId(queueDef: QueueDefinition): string {
  return queueDef.queue ?? queueDef.name ?? queueDef.job.id;
}

/** Convert CronDefinition to QueueDefinition for engine (queue = cron id). */
function cronToScheduleDef(cron: CronDefinition): QueueDefinition {
  return {
    job: cron.job,
    cron: cron.cron,
    queue: cron.id ?? cron.job.id,
  };
}

function wrapHandlerWithSkipCheck(
  scheduleId: string,
  handler: JobHandler,
  repo: {
    getSkipNextUntil?: (id: string) => Promise<SkipNextUntil>;
    setSkipNextUntil?: (id: string, value: SkipNextUntil) => Promise<void>;
  }
): JobHandler {
  const getSkip = repo.getSkipNextUntil;
  const setSkip = repo.setSkipNextUntil;
  if (!getSkip || !setSkip) return handler;
  return {
    async run(payload: unknown) {
      const until = await getSkip(scheduleId);
      if (until === "once") {
        await setSkip(scheduleId, null);
        return;
      }
      if (until instanceof Date && Date.now() < until.getTime()) return;
      if (until instanceof Date) await setSkip(scheduleId, null);
      await handler.run(payload);
    },
  };
}

export function createJob(options: CreateJobOptions): JobService {
  const {
    engine,
    repo,
    plugins = [],
    defaults,
    skipRuntimeCheck,
    crons = [],
    queues: queueDefs = [],
    handlers: handlersMap = {},
  } = options;

  if (!skipRuntimeCheck) {
    checkEngineCompatibility(engine);
  }

  const queues = new Map<string, RegisteredQueue>();
  const pluginContext: { setContext?: (k: string, v: unknown) => void } = {};

  for (const plugin of plugins) {
    plugin.init?.({ setContext: pluginContext.setContext });
  }

  function buildExecuteChain(
    jobId: string,
    payload: unknown,
    handler: JobHandler
  ): () => Promise<void> {
    let next: () => Promise<void> = () => handler.run(payload);

    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      const before = p?.beforeExecute;
      if (before) {
        const n = next;
        next = () => before({ jobId, payload, handler }, n);
      }
    }

    for (let i = 0; i < plugins.length; i++) {
      const p = plugins[i];
      const after = p?.afterExecute;
      if (after) {
        const n = next;
        next = () => after({ jobId, payload, handler }, n);
      }
    }

    return next;
  }

  async function doEnqueue(id: string, payload?: unknown): Promise<void> {
    const reg = queues.get(id);
    if (reg?.handler) {
      await executeWithPlugins(id, payload ?? {});
    } else {
      await engine.enqueue(id, payload);
    }
  }

  async function executeWithPlugins(jobId: string, payload: unknown): Promise<void> {
    const reg = queues.get(jobId);
    if (!reg?.handler) {
      throw new JobNotFoundError(jobId);
    }
    const chain = buildExecuteChain(jobId, payload, reg.handler);
    try {
      await chain();
    } catch (err) {
      for (const plugin of plugins) {
        await plugin.onError?.({ jobId, error: err });
      }
      throw err;
    }
  }

  const service: JobService = {
    async register(queueDef: QueueDefinition, handler?: JobHandler): Promise<void> {
      const id = queueId(queueDef);
      queues.set(id, { definition: queueDef, handler });
      if (repo) {
        await repo.saveDefinition(queueDef.job);
      }
      await engine.register(queueDef, handler);
    },

    async handle(queueDef: QueueDefinition, handler: JobHandler): Promise<void> {
      const id = queueId(queueDef);
      queues.set(id, { definition: queueDef, handler });
      if (engine.handle) {
        await engine.handle(queueDef, handler);
      }
    },

    async unregister(jobOrCronOrQueueOrId: JobOrId): Promise<void> {
      const id = resolveId(jobOrCronOrQueueOrId);
      queues.delete(id);
      if (repo) {
        await repo.deleteDefinition(id);
      }
      await engine.unregister(id);
    },

    async enqueue(jobOrQueueOrId: JobOrId, payload?: unknown): Promise<void> {
      return doEnqueue(resolveId(jobOrQueueOrId), payload);
    },

    async trigger(jobOrId: QueueDefinition | string, payload?: unknown): Promise<void> {
      const id = typeof jobOrId === "string" ? jobOrId : (jobOrId.queue ?? jobOrId.job.id);
      return doEnqueue(id, payload);
    },

    async listQueues(): Promise<QueueStatus[]> {
      return engine.listQueues();
    },

    async list(): Promise<QueueStatus[]> {
      return engine.listQueues();
    },

    async getStats(jobOrQueueOrId: JobOrId): Promise<JobStats> {
      return engine.stats(resolveId(jobOrQueueOrId));
    },

    async stats(jobOrQueueOrId: JobOrId): Promise<JobStats> {
      return engine.stats(resolveId(jobOrQueueOrId));
    },

    async dispatch(
      queueIdParam: string,
      req: DispatchRequest,
      preParsedBody?: unknown
    ): Promise<DispatchResult> {
      const reg = queues.get(queueIdParam);
      if (!reg) {
        return { status: 404, error: `Unknown queue: ${queueIdParam}` };
      }

      if (!reg.handler) {
        return { status: 500, error: `No handler registered for queue: ${queueIdParam}` };
      }

      try {
        const body = preParsedBody !== undefined ? preParsedBody : await parseBody(req);
        const payload = validatePayloadWithSchema(reg.definition.job.schema, body, queueIdParam);
        await executeWithPlugins(queueIdParam, payload);
        return { status: 200, body: { ok: true } };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { status: 400, error: message };
      }
    },

    async start(): Promise<void> {
      for (const cron of crons) {
        const handler = handlersMap[cron.job.id];
        if (!handler) throw new Error(`No handler for cron job ${cron.job.id}`);
        const def = cronToScheduleDef(cron);
        const wrapped = wrapHandlerWithSkipCheck(cron.id ?? cron.job.id, handler, repo ?? {});
        const id = queueId(def);
        queues.set(id, { definition: def, handler: wrapped });
        if (repo) await repo.saveDefinition(def.job);
        await engine.register(def, wrapped);
      }
      for (const queue of queueDefs) {
        const handler = handlersMap[queue.job.id];
        const id = queueId(queue);
        queues.set(id, { definition: queue, handler });
        if (repo) await repo.saveDefinition(queue.job);
        if (handler) await engine.register(queue, handler);
        else await engine.register(queue);
      }
      await engine.start();
    },

    async stop(): Promise<void> {
      await engine.stop();
    },

    supports(operation: keyof JobEngineContract["capabilities"]["supports"]): boolean {
      return Boolean(engine.capabilities.supports[operation]);
    },

    async pauseQueue(jobOrQueueOrId: JobOrId): Promise<void> {
      const id = resolveId(jobOrQueueOrId);
      if (engine.pauseQueue) {
        await engine.pauseQueue(id);
      } else if (engine.capabilities.supports.pauseQueue && repo) {
        await repo.setPaused(id, true);
      } else {
        throw new UnsupportedCapabilityError(engine.capabilities.name, "pauseQueue");
      }
    },

    async resumeQueue(jobOrQueueOrId: JobOrId): Promise<void> {
      const id = resolveId(jobOrQueueOrId);
      if (engine.resumeQueue) {
        await engine.resumeQueue(id);
      } else if (engine.capabilities.supports.resumeQueue && repo) {
        await repo.setPaused(id, false);
      } else {
        throw new UnsupportedCapabilityError(engine.capabilities.name, "resumeQueue");
      }
    },

    async skipNext(cronOrId: CronDefinition | string): Promise<void> {
      const id = typeof cronOrId === "string" ? cronOrId : (cronOrId.id ?? cronOrId.job.id);
      if (!repo?.setSkipNextUntil)
        throw new UnsupportedCapabilityError(engine.capabilities.name, "skipNext");
      await repo.setSkipNextUntil(id, "once");
    },

    async skipUntil(cronOrId: CronDefinition | string, until: Date): Promise<void> {
      const id = typeof cronOrId === "string" ? cronOrId : (cronOrId.id ?? cronOrId.job.id);
      if (!repo?.setSkipNextUntil)
        throw new UnsupportedCapabilityError(engine.capabilities.name, "skipUntil");
      await repo.setSkipNextUntil(id, until);
    },

    async disableCron(cronOrId: CronDefinition | string): Promise<void> {
      const id = typeof cronOrId === "string" ? cronOrId : (cronOrId.id ?? cronOrId.job.id);
      if (engine.pauseQueue) await engine.pauseQueue(id);
      else if (engine.capabilities.supports.pauseQueue && repo) await repo.setPaused(id, true);
      else throw new UnsupportedCapabilityError(engine.capabilities.name, "disableCron");
    },

    async enableCron(cronOrId: CronDefinition | string): Promise<void> {
      const id = typeof cronOrId === "string" ? cronOrId : (cronOrId.id ?? cronOrId.job.id);
      if (engine.resumeQueue) await engine.resumeQueue(id);
      else if (engine.capabilities.supports.resumeQueue && repo) await repo.setPaused(id, false);
      else throw new UnsupportedCapabilityError(engine.capabilities.name, "enableCron");
    },

    get _internal() {
      return { engine, queues };
    },
  };

  // Optional capability-checked methods
  const getQueueMetadata = engine.getQueueMetadata;
  if (getQueueMetadata) service.getQueueMetadata = (id) => getQueueMetadata(id);
  const listInstances = engine.listInstances;
  if (listInstances) service.listInstances = (id, status) => listInstances(id, status);
  const getInstance = engine.getInstance;
  if (getInstance) service.getInstance = (id, instanceId) => getInstance(id, instanceId);
  const cancelInstance = engine.cancelInstance;
  if (cancelInstance) service.cancelInstance = (id, instanceId) => cancelInstance(id, instanceId);
  const retryInstance = engine.retryInstance;
  if (retryInstance) service.retryInstance = (id, instanceId) => retryInstance(id, instanceId);
  const drain = engine.drain;
  if (drain) service.drain = (id, opts) => drain(id, opts);
  const getJobCounts = engine.getJobCounts;
  if (getJobCounts) service.getJobCounts = (id) => getJobCounts(id);

  return service;
}

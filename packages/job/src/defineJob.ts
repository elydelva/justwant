/**
 * @justwant/job — defineJob
 * Separates job definition from handler for portability and testability.
 */

import { createRequire } from "node:module";
import type { StandardSchemaV1 } from "@standard-schema/spec";

const require = createRequire(import.meta.url);
import { JobValidationError } from "./errors.js";
import type {
  JobDefaults,
  JobDefinition,
  JobHandler,
  JobHandlerContext,
  JobHandlerFn,
  JobLogger,
} from "./types.js";

const defaultLogger: JobLogger = {
  info: (msg, meta) => console.log(`[job] ${msg}`, meta ?? ""),
  warn: (msg, meta) => console.warn(`[job] ${msg}`, meta ?? ""),
  error: (msg, meta) => console.error(`[job] ${msg}`, meta ?? ""),
};

function validateWithValibot<T>(schema: unknown, value: unknown, jobId: string): T {
  try {
    const v = require("valibot") as {
      safeParse: (
        s: unknown,
        d: unknown
      ) => { success: boolean; output?: T; issues?: Array<{ message?: string }> };
    };
    const r = v.safeParse(schema, value);
    if (!r.success && r.issues?.length) {
      throw new JobValidationError(
        "Payload validation failed",
        jobId,
        r.issues.map((i) => ({ path: "", message: i.message ?? "Validation failed" }))
      );
    }
    return (r as { output?: T }).output as T;
  } catch (err) {
    if (err instanceof JobValidationError) throw err;
    throw new JobValidationError("Payload validation failed", jobId, [
      { path: "", message: err instanceof Error ? err.message : "Validation failed" },
    ]);
  }
}

function validatePayload<T>(
  schema: StandardSchemaV1<unknown, T>,
  value: unknown,
  jobId: string
): T {
  const std = (schema as { "~standard"?: { validate: (v: unknown) => unknown } })["~standard"];
  if (std?.validate) {
    const result = std.validate(value);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      throw new JobValidationError("Async validation not supported", jobId, [
        { path: "", message: "Async validation not supported" },
      ]);
    }
    const r = result as { value?: T; issues?: readonly { message?: string; path?: string }[] };
    if (r.issues?.length) {
      throw new JobValidationError(
        "Payload validation failed",
        jobId,
        (r.issues as { message?: string; path?: string }[]).map((i) => ({
          path: i.path ?? "",
          message: i.message ?? "Validation failed",
        }))
      );
    }
    return (r.value ?? value) as T;
  }
  if (typeof (schema as { _run?: unknown })._run === "function") {
    return validateWithValibot(schema, value, jobId);
  }
  return value as T;
}

export interface DefineJobConfig<N extends string = string, T = unknown> {
  name: N;
  schema?: StandardSchemaV1<unknown, T>;
  defaults?: JobDefaults;
}

/** Infer payload type from job definition. */
export type InferJobPayload<J> = J extends JobDefinition<string, infer T> ? T : never;

/**
 * Define work (handler + schema). No cron/queue — use defineQueue for execution params.
 * Extends Definable<N>: job(instanceId) → { type: N; id: instanceId }.
 * Use job.handle(fn) to create a handler with .run(payload).
 */
export function defineJob<N extends string, T = unknown>(
  config: DefineJobConfig<N, T>
): JobDefinition<N, T> & { handle(fn: JobHandlerFn<T>): JobHandler<T> } {
  const { name, schema, defaults } = config;

  const jobDef = ((instanceId: string) => ({ type: name, id: instanceId })) as JobDefinition<
    N,
    T
  > & {
    handle(fn: JobHandlerFn<T>): JobHandler<T>;
  };

  const handleFn = (fn: JobHandlerFn<T>): JobHandler<T> => {
    const handler: JobHandler<T> = {
      async run(payload: T): Promise<void> {
        const data = schema ? validatePayload(schema, payload, name) : (payload ?? ({} as T));

        const ctx: JobHandlerContext<T> = {
          data,
          job: {
            name,
            runCount: 1,
            startedAt: new Date(),
          },
          logger: defaultLogger,
        };

        await fn(ctx);
      },
    };
    return handler;
  };

  Object.defineProperties(jobDef, {
    name: { value: name, enumerable: true },
    schema: { value: schema, enumerable: true },
    defaults: { value: defaults, enumerable: true },
    handle: { value: handleFn, enumerable: false },
  });

  return jobDef;
}

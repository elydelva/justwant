# @justwant/job

Jobs, crons, queues. Engines: node, BullMQ, QStash, pg.

## Usage

```ts
import { createJob, defineJob, defineCron, defineQueue } from "@justwant/job";
import { nodeEngine } from "@justwant/job/engines/node";
import { createMemoryJobRepository } from "@justwant/job/repo/memory";

const dailyInvoice = defineJob({
  name: "daily-invoice",
  schema: v.object({ orgId: v.optional(v.string()) }),
});
const sendEmail = defineJob({
  name: "send-email",
  schema: v.object({ to: v.string(), template: v.string() }),
});

const jobService = createJob({
  engine: nodeEngine({ timezone: "Europe/Paris" }),
  repo: createMemoryJobRepository(),
  crons: [defineCron({ job: dailyInvoice, cron: "0 9 * * *" })],
  queues: [defineQueue({ job: sendEmail, name: "emails" })],
  handlers: {
    "daily-invoice": dailyInvoice.handle(async ({ data, logger }) => { /* ... */ }),
    "send-email": sendEmail.handle(async ({ data }) => { /* ... */ }),
  },
});

await jobService.start();
await jobService.enqueue(sendEmail, { to: "a@b.com", template: "welcome" });
await jobService.pauseQueue(sendEmail);
await jobService.resumeQueue(sendEmail);
await jobService.skipNext(dailyInvoice);
await jobService.skipUntil(dailyInvoice, new Date("2025-01-01"));
await jobService.disableCron(dailyInvoice);
await jobService.enableCron(dailyInvoice);
await jobService.stop();
```

## JobDefinition

`JobDefinition<N, T>` extends `Definable<N>`:
- `job.name` — the job type identifier (string literal)
- `job(instanceId)` → `{ type: "job-name", id: instanceId }` (Definable call)
- `job.handle(fn)` → `JobHandler<T>` with `.run(payload)` for isolated testing
- Schema: Standard Schema (`@standard-schema/spec`) — valibot/zod compatible

## CronDefinition vs QueueDefinition

- `defineCron({ job, cron, id? })` — scheduled only, no manual enqueue
- `defineQueue({ job, name?, queue?, cron?, parallelism?, aggregateSchedules? })` — enqueue + optional schedule

## Engines

| Engine | Import | Runtime |
|--------|--------|---------|
| `nodeEngine` | `engines/node` | Node / Bun |
| `bullmqEngine` | `engines/bullmq` | Node + Redis |
| `qstashEngine` | `engines/qstash` | Edge / Serverless |
| `pgEngine` | `engines/pg` | Node (Postgres) |

QStash framework middlewares: `engines/qstash/next`, `engines/qstash/express`, `engines/qstash/hono`, `engines/qstash/cloudflare`

## Plugins

| Plugin | Options | Import |
|--------|---------|--------|
| `lockPlugin` | `{ lock: LockApi, owner?, ttlMs? }` | `plugins/lock` |
| `auditPlugin` | `{ audit: { log } }` | `plugins/audit` |
| `alertPlugin` | `{ notify }` | `plugins/alert` |

Plugin hooks: `init`, `beforeExecute`, `afterExecute`, `onError`

## JobHandler context

```ts
interface JobHandlerContext<T> {
  data: T;
  job: { name: string; runCount: number; startedAt: Date };
  logger: { info, warn, error };
}
```

## createJob options

| Option | Type | Notes |
|--------|------|-------|
| `engine` | `JobEngineContract` | required |
| `repo` | `JobRepository` | optional, used by node engine for persistence |
| `plugins` | `JobPlugin[]` | |
| `defaults` | `{ timezone?, retry?, timeout? }` | |
| `crons` | `CronDefinition[]` | scheduled, no enqueue |
| `queues` | `QueueDefinition[]` | enqueueable |
| `handlers` | `Record<string, JobHandler>` | keyed by `job.name` |
| `skipRuntimeCheck` | `boolean` | skip engine compatibility check |

## RetryConfig

`{ attempts?, backoff?: "linear" | "exponential" | "fixed", delayMs? }`

## API

**Setup:** `createJob`, `defineJob`, `defineCron`, `defineQueue`

**Service:** `start`, `stop`, `enqueue`, `register`, `handle`, `unregister`, `dispatch`

**Queues:** `pauseQueue`, `resumeQueue`, `listQueues`, `getStats`

**Crons:** `skipNext`, `skipUntil`, `disableCron`, `enableCron`

**Capability-checked (engine dependent):** `getQueueMetadata`, `listInstances`, `getInstance`, `cancelInstance`, `retryInstance`, `drain`, `getJobCounts`

Use `service.supports("pauseQueue")` to check capability before calling.

## Errors

`JobError`, `EngineIncompatibleError`, `JobNotFoundError`, `JobValidationError`, `UnsupportedCapabilityError` — exported from `@justwant/job`.

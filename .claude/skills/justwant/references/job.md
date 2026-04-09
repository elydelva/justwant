# @justwant/job

Jobs, crons, queues. Engines: node, BullMQ, QStash, pg.

## Usage

```ts
import { createJob, defineJob, defineCron, defineQueue } from "@justwant/job";
import { nodeEngine } from "@justwant/job/engines/node";
import { createMemoryJobRepository } from "@justwant/job/repo/memory";

// defineJob — name: is the identifier (extends Definable<N>)
const dailyInvoice = defineJob({ name: "daily-invoice", schema: v.object({ orgId: v.optional(v.string()) }) });
const sendEmail = defineJob({ name: "send-email", schema: v.object({ to: v.string(), template: v.string() }) });

const jobService = createJob({
  engine: nodeEngine({ timezone: "Europe/Paris" }),
  repo: createMemoryJobRepository(),
  crons: [defineCron({ job: dailyInvoice, cron: "0 9 * * *" })],
  queues: [defineQueue({ job: sendEmail, name: "emails" })],
  handlers: {
    "daily-invoice": dailyInvoice.handle(async ({ data }) => { /* ... */ }),
    "send-email": sendEmail.handle(async ({ data }) => { /* ... */ }),
  },
});

await jobService.start();
await jobService.enqueue(sendEmail, { to: "a@b.com", template: "welcome" });
await jobService.pauseQueue(queue);
await jobService.skipNext(cron);
```

## JobDefinition

`JobDefinition<N, T>` extends `Definable<N>`:
- `job.name` — the job type identifier
- `job("inst_1")` → `{ type: "daily-invoice", id: "inst_1" }`
- `job.handle(fn)` → `JobHandler<T>` for direct execution

## Engines

| Engine | Import | Runtime |
|--------|--------|---------|
| `nodeEngine` | `engines/node` | Node |
| `bullmqEngine` | `engines/bullmq` | Node + Redis |
| `qstashEngine` | `engines/qstash` | Edge/Serverless |
| `pgEngine` | `engines/pg` | Node |

QStash middlewares: `engines/qstash/next`, `engines/qstash/express`, `engines/qstash/hono`, `engines/qstash/cloudflare`

## Plugins

| Plugin | Options | Import |
|--------|---------|--------|
| `lockPlugin` | `{ lock, owner?, ttlMs? }` | `plugins/lock` |
| `auditPlugin` | `{ audit: { log } }` | `plugins/audit` |
| `alertPlugin` | `{ notify }` | `plugins/alert` |

## API

`createJob`, `defineJob`, `defineCron`, `defineQueue`, `job.handle` — `start`, `enqueue`, `pauseQueue`, `resumeQueue`, `skipNext`, `skipUntil`, `disableCron`, `enableCron`

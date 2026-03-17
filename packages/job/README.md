# @justwant/job

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Unified job service. Engine composition (BullMQ, QStash, pg, node-cron). defineJob (work) + defineCron (scheduled only) + defineQueue (enqueue + pause), plugins, framework middlewares.

## Installation

```bash
bun add @justwant/job
# or
npm install @justwant/job
# or
pnpm add @justwant/job
```

For engines: `bun add node-cron` (node) | `bun add bullmq ioredis` (BullMQ) | `bun add @upstash/qstash` (QStash) | `bun add cron-parser` (pg)

## Usage

### Declarative: crons + queues + handlers

```ts
import { createJob, defineJob, defineCron, defineQueue } from "@justwant/job";
import { nodeEngine } from "@justwant/job/engines/node";
import { createMemoryJobRepository } from "@justwant/job/repo/memory";
import * as v from "valibot";

const dailyInvoice = defineJob({
  id: "daily-invoice",
  schema: v.object({ orgId: v.optional(v.string()) }),
  defaults: { timezone: "Europe/Paris" },
});

const sendEmail = defineJob({
  id: "send-email",
  schema: v.object({ to: v.string(), template: v.string() }),
});

const crons = [defineCron({ job: dailyInvoice, cron: "0 9 * * *" })];

const queues = [
  defineQueue({ job: sendEmail, name: "emails" }),
  defineQueue({ job: dailyInvoice, name: "invoices" }),
];

const jobService = createJob({
  engine: nodeEngine({ timezone: "Europe/Paris" }),
  repo: createMemoryJobRepository(),
  crons,
  queues,
  handlers: {
    "daily-invoice": dailyInvoice.handle(async ({ data }) => {
      await generateDailyInvoices(data.orgId);
    }),
    "send-email": sendEmail.handle(async ({ data }) => {
      await sendEmailTemplate(data.to, data.template);
    }),
  },
});

await jobService.start();

// Prefer objects over IDs
await jobService.enqueue(sendEmail, { to: "a@b.com", template: "welcome" });
await jobService.enqueue(queues[1], { orgId: "org_123" });
await jobService.pauseQueue(queues[0]);

// Crons: skip / disable
await jobService.skipNext(crons[0]);
await jobService.skipUntil(crons[0], new Date("2025-03-15T12:00:00"));
await jobService.disableCron(crons[0]);
await jobService.enableCron(crons[0]);
```

### Imperative: register + handle

```ts
import { createJob, defineJob, defineQueue } from "@justwant/job";
import { nodeEngine } from "@justwant/job/engines/node";
import { createMemoryJobRepository } from "@justwant/job/repo/memory";

const dailyInvoiceJob = defineJob({ id: "daily-invoice" });
const dailyInvoiceQueue = defineQueue({
  job: dailyInvoiceJob,
  cron: "0 9 * * *",
});

const handler = dailyInvoiceJob.handle(async ({ data }) => {
  await generateDailyInvoices(data.orgId);
});

const jobService = createJob({
  engine: nodeEngine({ timezone: "Europe/Paris" }),
  repo: createMemoryJobRepository(),
});

await jobService.register(dailyInvoiceQueue, handler);
await jobService.enqueue(dailyInvoiceQueue, { orgId: "org_123" });
await jobService.pauseQueue(dailyInvoiceQueue);
```

### Engines

| Engine | Use case | Runtime |
|--------|----------|---------|
| `nodeEngine` | Dev local, no Redis | Node persistent |
| `bullmqEngine` | Prod, Redis | Node persistent |
| `qstashEngine` | Vercel, Cloudflare, Lambda | Edge/Serverless |
| `pgEngine` | Postgres only | Node persistent |

### QStash + Next.js

```ts
// lib/job.ts
import { createJob } from "@justwant/job";
import { qstashEngine } from "@justwant/job/engines/qstash";
import { Client } from "@upstash/qstash";

const jobService = createJob({
  engine: qstashEngine({
    client: new Client({ token: process.env.QSTASH_TOKEN! }),
    baseUrl: process.env.APP_URL!,
    signingKey: process.env.QSTASH_SIGNING_KEY,
  }),
});

// app/api/job/[jobId]/route.ts
import { jobService } from "@/lib/job";
import { qstashMiddleware } from "@justwant/job/engines/qstash/next";

export const POST = qstashMiddleware(jobService);
```

### Plugins

#### lockPlugin

Prevents double execution across instances using distributed lock.

```ts
import { lockPlugin } from "@justwant/job/plugins/lock";
import { createLock } from "@justwant/lock";

const jobService = createJob({
  engine: nodeEngine(),
  plugins: [
    lockPlugin({
      lock: createLock({ repo: myLockRepo }),
      owner: { type: "job", id: "worker-1" },  // optional
      ttlMs: 60_000,  // lock TTL, default 60s
    }),
  ],
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lock` | LockApi | required | @justwant/lock instance |
| `owner` | LockOwner | `{ type: "job", id: "default" }` | Lock owner |
| `ttlMs` | number | 60000 | Lock TTL in ms |

#### auditPlugin

Logs each job execution for audit trail.

```ts
import { auditPlugin } from "@justwant/job/plugins/audit";

const jobService = createJob({
  engine: nodeEngine(),
  plugins: [
    auditPlugin({
      audit: {
        log: (entry) => console.log(entry),
        // entry: { jobId, startedAt, durationMs, status, payloadHash }
      },
    }),
  ],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `audit.log` | (entry: AuditEntry) => void | Called after each execution |

#### alertPlugin

Notifies on job failure.

```ts
import { alertPlugin } from "@justwant/job/plugins/alert";

const jobService = createJob({
  engine: nodeEngine(),
  plugins: [
    alertPlugin({
      notify: (payload) => sendSlackAlert(payload),
      // payload: { jobId, error, runCount? }
    }),
  ],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `notify` | (payload: AlertPayload) => void | Called on job failure |

### Engines (detailed)

| Engine | Import | Use case | Runtime |
|--------|--------|----------|---------|
| `nodeEngine` | `@justwant/job/engines/node` | Dev local, no Redis | Node persistent |
| `bullmqEngine` | `@justwant/job/engines/bullmq` | Prod, Redis | Node persistent |
| `qstashEngine` | `@justwant/job/engines/qstash` | Vercel, Cloudflare, Lambda | Edge/Serverless |
| `pgEngine` | `@justwant/job/engines/pg` | Postgres only | Node persistent |

**QStash middlewares:** `@justwant/job/engines/qstash/next` (Next.js), `@justwant/job/engines/qstash/express`, `@justwant/job/engines/qstash/hono`, `@justwant/job/engines/qstash/cloudflare`

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/job` | createJob, defineJob, defineCron, defineQueue, types, errors |
| `@justwant/job/defineCron` | defineCron |
| `@justwant/job/defineQueue` | defineQueue |
| `@justwant/job/repo/memory` | MemoryJobRepository (tests) |
| `@justwant/job/engines/node` | node-cron engine |
| `@justwant/job/engines/bullmq` | BullMQ engine |
| `@justwant/job/engines/qstash` | QStash engine |
| `@justwant/job/engines/qstash/next` | Next.js App Router middleware |
| `@justwant/job/engines/qstash/express` | Express middleware |
| `@justwant/job/engines/qstash/hono` | Hono middleware |
| `@justwant/job/engines/qstash/cloudflare` | Cloudflare Workers handler |
| `@justwant/job/engines/pg` | Postgres polling engine |
| `@justwant/job/plugins/lock` | Lock plugin |
| `@justwant/job/plugins/audit` | Audit plugin |
| `@justwant/job/plugins/alert` | Alert plugin |

## API

| Export | Description |
|--------|-------------|
| `createJob(options)` | Create job service |
| `defineJob(options)` | Define job with schema, defaults |
| `defineCron(options)` | Define cron schedule |
| `defineQueue(options)` | Define queue |
| `job.handle(fn)` | Attach handler to job |

| Service method | Description |
|----------------|-------------|
| `start()` | Start crons and queues |
| `enqueue(jobOrQueue, data)` | Enqueue job |
| `pauseQueue(queue)` / `resumeQueue(queue)` | Pause/resume queue |
| `skipNext(cron)` / `skipUntil(cron, date)` | Skip next cron run |
| `disableCron(cron)` / `enableCron(cron)` | Disable/enable cron |

## License

MIT

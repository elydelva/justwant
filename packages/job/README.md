# @justwant/job

Unified job service. Engine composition (BullMQ, QStash, pg, node-cron). defineJob (work) + defineCron (scheduled only) + defineQueue (enqueue + pause), plugins, framework middlewares.

## Installation

```bash
bun add @justwant/job
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

```ts
import { lockPlugin } from "@justwant/job/plugins/lock";
import { auditPlugin } from "@justwant/job/plugins/audit";
import { alertPlugin } from "@justwant/job/plugins/alert";
import { createLock } from "@justwant/lock";

const jobService = createJob({
  engine: nodeEngine(),
  plugins: [
    lockPlugin({ lock: createLock({ repo }) }),
    auditPlugin({ audit: { log: (e) => console.log(e) } }),
    alertPlugin({ notify: (p) => sendAlert(p) }),
  ],
});
```

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

## License

MIT

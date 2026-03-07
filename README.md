# @justwant

A backend. A database. A storage bucket.  
That's a complete platform.

**`@justwant/*`** is a TypeScript-first library ecosystem that covers authentication, observability, billing, notifications, file storage, and much more — using infrastructure you already own.

```ts
import { createEverything }    from '@justwant/everything'
import { createDrizzleAdapter } from '@justwant/db/drizzle'
import { emailPasswordPlugin } from '@justwant/auth/plugin-email-password'
import { oauthPlugin }         from '@justwant/auth/plugin-oauth'
import { twoFactorPlugin }     from '@justwant/auth/plugin-two-factor'
import { integrityPlugin }     from '@justwant/audit/plugin-integrity'
import { retentionPlugin }     from '@justwant/audit/plugin-retention'

export const { auth, audit, keys, notify } = createEverything({
  adapters: {
    db: createDrizzleAdapter(db, { dialect: 'pg' }),
  },
  auth: {
    plugins: [
      emailPasswordPlugin(),
      oauthPlugin({ providers: ['google', 'github'] }),
      twoFactorPlugin(),
    ],
  },
  audit: {
    plugins: [
      integrityPlugin(),
      retentionPlugin({ after: '90d', action: 'anonymize' }),
    ],
  },
})
```

You can also instantiate each package independently — `createEverything` is just the orchestrator that wires them together and shares adapters across packages.

```ts
import { createAudit }     from '@justwant/audit'
import { integrityPlugin } from '@justwant/audit/plugin-integrity'
import { pgAdapter }       from '@justwant/audit/adapter-pg'

const audit = createAudit({
  adapter: pgAdapter(pool),
  plugins: [integrityPlugin()],
})
```

---

## What's included

With a backend, a database, and a storage bucket, you now have:

Authentication · Permissions · Consent · Audit trail · Observability · Analytics · File storage · Notifications · Webhooks · Rate limiting · Feature flags · API key management · Scheduled jobs · Task queues · Billing · CMS · Session replay · Onboarding · Real-time · Data pipeline · Waitlist

**No vendor lock-in. No data leaving your infrastructure. No third-party terms applied to your users.**

---

## Packages

### Foundation

Small, focused packages with no inter-package dependencies. Everything else is built on top of these.

| Package | Role |
|---|---|
| [`@justwant/db`](./packages/db) | Data Access Layer. Contracts, Drizzle, Prisma, Waddler. `defineContract()`, `AdapterError`, `createDrizzleAdapter` |
| [`@justwant/plugin`](./packages/plugin) | Plugin system. `createPlugin()`, dependency graph, declaration merging |
| [`@justwant/id`](./packages/id) | ID generation. `ulid()`, `uuid()`, `prefixed('key')` → `key_01J8X` |
| [`@justwant/crypto`](./packages/crypto) | HMAC, hash, sign, verify, encrypt, decrypt |
| [`@justwant/env`](./packages/env) | Typed environment variables. Zod schema, coercion, expansion, redaction |
| [`@justwant/lock`](./packages/lock) | Distributed locks. `acquire(key, fn, { ttl })` |
| [`@justwant/retry`](./packages/retry) | Retry with backoff. Exponential, linear, and fixed strategies |
| [`@justwant/event`](./packages/event) | Internal event bus. Decouples packages from each other |
| [`@justwant/context`](./packages/context) | Request context propagation via `AsyncLocalStorage` |
| [`@justwant/cookie`](./packages/cookie) | Cookie read/write. Signed, httpOnly, sameSite, `__Host-` prefix |
| [`@justwant/config`](./packages/config) | Multi-source config with waterfall resolution. `get()`, watch, cache |

### Building blocks

Packages that combine foundation primitives into reusable cross-cutting concerns.

| Package | Role |
|---|---|
| [`@justwant/cron`](./packages/cron) | Scheduled jobs. Pluggable runners (Node, Cloudflare, Vercel, QStash) |
| [`@justwant/queue`](./packages/queue) | Event-triggered jobs. Steps, durability, fan-out, sleep |
| [`@justwant/storage`](./packages/storage) | File upload/download. Multipart, lifecycle, signed URLs, scan, transform |
| [`@justwant/protect`](./packages/protect) | HTTP security. Rate limiting, IP intelligence, bot detection, WAF |
| [`@justwant/flag`](./packages/flag) | Feature flags. Typed evaluation, rollout, targeting, A/B |
| [`@justwant/preference`](./packages/preference) | User preferences. Namespaced, typed, global → plan → user inheritance |
| [`@justwant/consent`](./packages/consent) | GDPR consent. History, versioning, legal proof, expiry, right to erasure |
| [`@justwant/permission`](./packages/permission) | RBAC/ABAC. Roles, ownership, delegation, hierarchy, scope |
| [`@justwant/audit`](./packages/audit) | Immutable event log. HMAC chaining, redaction, retention, export |
| [`@justwant/webhook`](./packages/webhook) | Outbound webhooks. Signing, retry, dead-letter, delivery tracking |
| [`@justwant/notify`](./packages/notify) | Multi-channel notifications. Templates, routing, digest, deduplication |

### Features

Higher-level packages that expose direct product value, built entirely on top of the two groups above.

| Package | Replaces | What it does |
|---|---|---|
| [`@justwant/auth`](./packages/auth) | Auth0, Clerk | Sessions, OAuth 40+, 2FA, passkeys, organizations, SCIM |
| [`@justwant/keys`](./packages/keys) | Unkey, Zuplo | Hashed API keys, per-key rate limits, credits, rotation |
| [`@justwant/analytics`](./packages/analytics) | Plausible, Mixpanel | Events, sessions, funnels, retention, privacy-first |
| [`@justwant/monitor`](./packages/monitor) | Sentry, Bugsnag | Error tracking, performance, source maps, alerting |
| [`@justwant/billing`](./packages/billing) | Stripe Billing, Paddle | Plans, credits, usage-based billing, trials, dunning |
| [`@justwant/cms`](./packages/cms) | Contentful, Sanity | Typed schemas, CRUD, versioning, preview, i18n, media |
| [`@justwant/support`](./packages/support) | Intercom, Crisp | Conversations, tickets, agents, automatic user context |
| [`@justwant/onboarding`](./packages/onboarding) | Userflow, Appcues | Steps, progress tracking, nudges, completion hooks |
| [`@justwant/waitlist`](./packages/waitlist) | Custom solutions | Sign-up, referral, position, batch invitations |
| [`@justwant/pipeline`](./packages/pipeline) | Segment, RudderStack | Sources → transforms → destinations, event fan-out |
| [`@justwant/feature`](./packages/feature) | PostHog, Hotjar | Session replay, heatmaps, surveys, breadcrumbs |

---

## How it works

### Adapter pattern

Every package that touches persistence accepts an adapter. You bring the database — the package brings the logic.

```ts
import { createAudit }    from '@justwant/audit'
import { prismaAdapter }  from '@justwant/audit/adapter-prisma'
import { drizzleAdapter } from '@justwant/audit/adapter-drizzle'
import { pgAdapter }      from '@justwant/audit/adapter-pg'

// Pick what matches your stack
const audit = createAudit({ adapter: prismaAdapter(prismaClient) })
const audit = createAudit({ adapter: drizzleAdapter(db, { schema }) })
const audit = createAudit({ adapter: pgAdapter(pool) })

// Or implement the contract directly for anything else
const audit = createAudit({
  adapter: {
    async insert(event) { /* your logic */ },
    async findMany(filters) { /* your logic */ },
  },
})
```

### Plugin system

Each package has a minimal everything. Features are opt-in plugins — imported explicitly, so bundlers only include what you actually use.

```ts
import { createAudit }     from '@justwant/audit'
import { integrityPlugin } from '@justwant/audit/plugin-integrity'
import { retentionPlugin } from '@justwant/audit/plugin-retention'
import { streamPlugin }    from '@justwant/audit/plugin-stream'
import { pgAdapter }       from '@justwant/audit/adapter-pg'

const audit = createAudit({
  adapter: pgAdapter(pool),
  plugins: [
    integrityPlugin(),
    retentionPlugin({ after: '90d', action: 'anonymize' }),
    streamPlugin({ destination: webhookAdapter() }),
  ],
})
```

### Subpath exports

Adapters and plugins are isolated subpath exports. Your bundler only loads what you import — nothing else is included.

```ts
// Only these files end up in your bundle
import { createAudit }     from '@justwant/audit'
import { integrityPlugin } from '@justwant/audit/plugin-integrity'
import { pgAdapter }       from '@justwant/audit/adapter-pg'

// Other adapters are never loaded, never bundled
// @justwant/audit/adapter-prisma
// @justwant/audit/adapter-drizzle
```

### Declaration merging

Plugins extend types without patching the everything. The result is always fully typed, inferred directly from your config.

```ts
// With creditsPlugin and rateLimitPlugin active on @justwant/keys:
const result = await keys.verify('sk_live_abc123')

result.valid               // always present
result.credits.remaining   // typed — only when creditsPlugin is active
result.rateLimit.reset     // typed — only when rateLimitPlugin is active
result.permissions         // typed — only when permissionPlugin is active
```

---

## Getting started

```bash
pnpm add @justwant/everything

# Then add the packages you need
pnpm add @justwant/auth @justwant/audit

# Peer dependencies — install only what your adapters require
pnpm add drizzle-orm  # Drizzle adapters
```

### Schema generation

```bash
# Generate SQL migrations for all active packages
npx justwant migrate generate --dialect postgres

# For your ORM
npx justwant migrate generate --adapter prisma   # outputs Prisma model blocks
npx justwant migrate generate --adapter drizzle  # outputs table definitions
```

---

## Repository structure

```
@justwant/
├── packages/
│   ├── adapter/       # Foundation
│   ├── plugin/
│   ├── id/
│   ├── crypto/
│   ├── env/
│   ├── cache/
│   ├── lock/
│   ├── retry/
│   ├── event/
│   ├── context/
│   ├── cookie/
│   ├── config/
│   │
│   ├── cron/          # Building blocks
│   ├── queue/
│   ├── storage/
│   ├── protect/
│   ├── flag/
│   ├── preference/
│   ├── consent/
│   ├── permission/
│   ├── audit/
│   ├── webhook/
│   ├── notify/
│   │
│   ├── everything/          # createEverything orchestrator
│   │
│   ├── auth/          # Features
│   ├── keys/
│   ├── analytics/
│   ├── monitor/
│   ├── billing/
│   ├── cms/
│   ├── support/
│   ├── onboarding/
│   ├── waitlist/
│   ├── pipeline/
│   └── feature/
│
├── docs/
└── examples/          # Next.js, Nuxt, Hono, Express
```

**Dependency rule:** Foundation packages import nothing from this repo. Building blocks import Foundation only. Features import both — but never each other. Cross-feature communication goes through `@justwant/event`.

---

## Contributing

This is a [pnpm workspace](https://pnpm.io/workspaces) monorepo.

```bash
pnpm install                # install all dependencies
pnpm build                  # build all packages
pnpm test                   # run all tests
cd packages/db && pnpm dev  # work on a single package
```

Each package has its own `CONTRIBUTING.md` with adapter and plugin authoring guidelines.

---

## License

MIT — see [LICENSE](./LICENSE)
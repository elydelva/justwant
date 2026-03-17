# @justwant/context

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Modular context with **explicit propagation**. No AsyncLocalStorage — context is instantiated and passed to children. Compatible Node, Edge, Bun, Deno.

## Features

- **Explicit propagation** — context passed as parameter (Edge, browser compatible)
- **Typed slots** — `defineSlot` with lazy, on-demand, or eager resolution
- **Per-instance cache** — each `RequestContext` memoizes slot resolution
- **Framework-agnostic** — no runtime dependencies

## Installation

```bash
bun add @justwant/context
# or
npm install @justwant/context
# or
pnpm add @justwant/context
```

## Usage

### 1. Define slots

```ts
import { createContextService, defineSlot } from "@justwant/context";

const userSlot = defineSlot({
  key: "user",
  scope: "on-demand",
  resolve: async (ctx) => {
    const userId = ctx.initial.userId as string;
    return userApi.findById(userId);
  },
});

const orgSlot = defineSlot({
  key: "org",
  scope: "on-demand",
  resolve: async (ctx) => {
    const user = await ctx.get(userSlot);
    const orgId = ctx.initial.orgId as string;
    return orgApi.findById(orgId);
  },
});
```

### 2. Create context

```ts
const ctx = createContextService({ slots: [userSlot, orgSlot] });
```

### 3. Use per request

```ts
app.get("/docs", async (req, res) => {
  const requestCtx = ctx.forRequest({
    userId: req.user?.id,
    orgId: req.headers["x-org-id"],
    requestId: req.id,
  });
  const docs = await getDocuments(requestCtx);
  res.json(docs);
});

async function getDocuments(requestCtx) {
  const user = await requestCtx.get(userSlot); // resolved once, cached
  const org = await requestCtx.get(orgSlot); // depends on user, cached
  return db.findMany({ orgId: org.id });
}
```

## defineSlot options

| Option | Type | Description |
|--------|------|-------------|
| `key` | string | Slot identifier |
| `scope` | "eager" \| "request" \| "on-demand" | When to resolve (see below) |
| `resolve` | (ctx) => Promise<T> | Async resolver. Use `ctx.get(otherSlot)` for dependencies. |

## Slot scopes

| Scope | When resolved | Use case |
|-------|---------------|----------|
| **eager** | At `forRequest()` | Values already known (e.g. from middleware) |
| **request** | At `forRequest()` | Depends on `initial` (requestId, etc.) |
| **on-demand** | At first `get()` | Expensive (DB, JWT, external API) — lazy load |

## Integration with user, org, group

See [docs/INTEGRATION_USER_ORG_GROUP.md](./docs/INTEGRATION_USER_ORG_GROUP.md) for examples of flexible context injection with user, organisation, and group packages.

## Subpath exports

```ts
import { createContextService, defineSlot } from "@justwant/context";
import type { SlotDef, RequestContext } from "@justwant/context/types";
import { SlotNotFoundError, ResolutionError } from "@justwant/context/errors";
```

## API

| Export | Description |
|--------|-------------|
| `createContextService(options)` | Create context with slots |
| `defineSlot(options)` | Define slot with key, scope, resolve |
| `requestCtx.get(slot)` | Resolve slot (cached) |
| `requestCtx.forRequest(initial)` | Create per-request context |

## License

MIT

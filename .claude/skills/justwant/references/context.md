# @justwant/context

Explicit, typed context propagation. No AsyncLocalStorage — runs on Node, Bun, Deno, Edge.

## Install

```bash
bun add @justwant/context
```

## Imports

```ts
import { defineSlot, createContextService } from "@justwant/context";
import type { SlotDef, SlotScope, RequestContext, ContextApi, ContextOptions } from "@justwant/context";
```

## defineSlot

```ts
const userSlot = defineSlot<{ id: string; role: string }>({
  key: "user",
  scope: "request",
  resolve: async (ctx) => verifyJwt(ctx.initial["authToken"] as string),
});

const settingsSlot = defineSlot<UserSettings>({
  key: "settings",
  scope: "on-demand",
  resolve: async (ctx) => {
    const user = await ctx.get(userSlot); // slots can depend on other slots
    return fetchSettings(user.id);
  },
});
```

| Option | Type | Description |
|--------|------|-------------|
| `key` | `string` | Unique slot identifier |
| `scope` | `SlotScope` | `"eager"` \| `"request"` \| `"on-demand"` |
| `resolve` | `(ctx: RequestContext) => Promise<T>` | Async resolver function |

## createContextService

```ts
const contextService = createContextService({
  slots: [dbSlot, userSlot, settingsSlot],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `slots` | `readonly SlotDef<unknown>[]` | All slot definitions managed by this service |

## forRequest / get

```ts
const ctx = contextService.forRequest({
  authToken: req.headers.get("authorization") ?? "",
  requestId: crypto.randomUUID(),
});

const user = await ctx.get(userSlot);    // typed as { id: string; role: string }
const db   = await ctx.get(dbSlot);

console.log(ctx.initial["requestId"]);   // frozen initial values
```

Each slot is resolved at most once per context — `ctx.get(slot)` returns the same `Promise` on repeat calls.

## Slot scopes

| Scope | Resolves at | Use for |
|-------|-------------|---------|
| `"eager"` | `forRequest()` immediately | Infrastructure (db, cache, config) |
| `"request"` | `forRequest()` immediately | Per-request identity (user, session) |
| `"on-demand"` | First `ctx.get(slot)` call | Conditionally needed or expensive values |

## RequestContext shape

| Property | Type | Description |
|----------|------|-------------|
| `initial` | `Readonly<Record<string, unknown>>` | Frozen object passed to `forRequest` |
| `get<T>(slot)` | `(slot: SlotDef<T>) => Promise<T>` | Resolve slot value, memoized |

## Errors

| Class | When thrown | Key properties |
|-------|-------------|----------------|
| `ContextError` | Base class | `message` |
| `SlotNotFoundError` | `ctx.get(slot)` with unregistered slot | `slotKey: string` |
| `ResolutionError` | Resolver threw | `slotKey: string`, `cause: unknown` |

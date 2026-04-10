# @justwant/event

Typed pub/sub event bus. Define events with payloads, subscribe with type-safe handlers, wildcard patterns.

## Install

```bash
bun add @justwant/event
```

## Imports

```ts
import { defineEvent, createEventBus } from "@justwant/event";
import { createPrimitiveEventBus } from "@justwant/event/primitive";
```

## defineEvent

```ts
const userCreated = defineEvent("user.created", (id: string, email: string) => ({ id, email }));
const appStarted = defineEvent("app.started", () => ({ startedAt: Date.now() }));
```

- Name uses `domain.action` format to enable `domain.*` wildcard matching
- `as const` required when passing event array to `createEventBus`

## createEventBus

```ts
const bus = createEventBus({
  events: [userCreated, orderShipped] as const,
  wildcard: true, // default
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `events` | `readonly TypedEvent[]` | required | Use `as const` to preserve literal types |
| `wildcard` | `boolean` | `true` | Enable `user.*` and `*` patterns on listen/listenOnce |

## Bus methods

```ts
// emit — void or Promise<void> (async handlers)
bus.emit(userCreated, "usr_01", "alice@example.com");
bus.emit("user.created", "usr_01", "alice@example.com");

// listen — returns unsubscribe fn
const unsub = bus.listen(userCreated, ({ id, email }) => {});
bus.listen("user.*", (payload) => {}); // wildcard
bus.listen("*", (payload) => {});      // all events
unsub();

// listenOnce — auto-unsubscribes after first dispatch, returns cancel fn
bus.listenOnce("order.shipped", ({ orderId }) => {});

// unlisten — remove specific handler reference
bus.unlisten("user.created", handler);
```

## Wildcard patterns

| Pattern | Matches |
|---------|---------|
| `"user.*"` | All events starting with `user.` |
| `"*"` | Every event |
| `"user.created"` | Exact name only |

Wildcards only work on `listen`/`listenOnce`, not on `emit`.

## Async handlers

`emit` returns `Promise<void>` when any handler is async. Use `await bus.emit(...)` to wait for all handlers.

## /primitive subpath

Untyped, dependency-free bus for dynamic event names:

```ts
import { createPrimitiveEventBus } from "@justwant/event/primitive";

const bus = createPrimitiveEventBus();
bus.listen("user.created", (payload) => {});
bus.emit("user.created", { id: "1" });
```

Interface: `emit(type, payload?)`, `listen<T>(type, handler)`, `listenOnce<T>(type, handler)`, `unlisten(type, handler)`. Supports same wildcard logic.

## TypedEvent shape

| Property | Type | Description |
|----------|------|-------------|
| `type` | `TType` | String literal event name |
| `createPayload` | `(...args: TArgs) => TPayload` | Constructs payload from emit args |

## Type utilities

| Type | Description |
|------|-------------|
| `PayloadForPattern<TEvents, Pattern>` | Payload type for a listen pattern |
| `EmitArgsForPattern<TEvents, Pattern>` | Argument tuple for emit |
| `WildcardPatterns<TEvents>` | Union of valid wildcard patterns |

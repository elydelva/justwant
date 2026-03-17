# @justwant/event

[![npm version](https://img.shields.io/npm/v/@justwant/event.svg)](https://www.npmjs.com/package/@justwant/event)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Typed, in-process event bus. Root = typed API. `/primitive` = primitive.

## Installation

```bash
bun add @justwant/event
# or
npm install @justwant/event
# or
pnpm add @justwant/event
```

## Usage — @justwant/event (typed, default)

```ts
import { defineEvent, createEventBus } from "@justwant/event";

const UserCreated = defineEvent("user.created", (id: string, email: string) => ({ id, email }));
const OrderPlaced = defineEvent("order.placed", (orderId: string) => ({ orderId }));

const bus = createEventBus({ events: [UserCreated, OrderPlaced] });

// Emit (TypedEvent or string literal with autocomplete)
bus.emit(UserCreated, "1", "a@b.com");
bus.emit("user.created", "1", "a@b.com");

// Listen (TypedEvent or string literal with typed payload)
bus.listen(UserCreated, ({ id, email }) => console.log(id, email));
bus.listen("user.created", ({ id, email }) => console.log(id, email));

// Once
bus.listenOnce(UserCreated, handler);

// Unlisten
bus.unlisten(UserCreated, handler);
```

`defineEvent(name, builder)` — the builder's args become `emit` args, its return value is the payload.

### Wildcard patterns (default: enabled)

When `wildcard` is `true` (default), `listen` and `listenOnce` accept patterns to subscribe to event families:

```ts
const UserCreated = defineEvent("user.created", (id: string) => ({ id }));
const UserUpdated = defineEvent("user.updated", (id: string, name: string) => ({ id, name }));
const OrderPlaced = defineEvent("order.placed", (orderId: string) => ({ orderId }));

const bus = createEventBus({ events: [UserCreated, UserUpdated, OrderPlaced] });

// Listen to all user.* events — payload is { id: string } | { id: string; name: string }
bus.listen("user.*", (payload) => console.log(payload));

// Listen to all events
bus.listen("*", (payload) => console.log(payload));
```

Patterns are inferred from event names: `user.created` and `user.updated` yield `user.*`. TypeScript infers the payload union automatically.

Wildcard `user.*` matches `user.created`, `user.updated` (prefix + suffix) but NOT bare `user` (no suffix). `*` matches all events.

To disable: `createEventBus({ events: [...], wildcard: false })`.

## Usage — @justwant/event/primitive

For dynamic event names (runtime, no schema):

```ts
import { createPrimitiveEventBus } from "@justwant/event/primitive";

const bus = createPrimitiveEventBus();

bus.emit("user.created", { id: "1", email: "a@b.com" });
bus.listen("user.created", (payload) => console.log(payload));
bus.listen("user.*", (payload) => console.log(payload)); // wildcard
bus.listenOnce("user.created", handler);
bus.unlisten("user.created", handler);
```

## Async handlers

Handlers can return `Promise`. `emit` returns `Promise<void>` when any handler is async (waits for all).

## createEventBus options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `events` | TypedEvent[] | required | Event definitions |
| `wildcard` | boolean | true | Enable `user.*` and `*` patterns |

## When to use typed vs primitive

- **Typed** (`createEventBus`): Event names and payloads are known at compile time. Use for app events.
- **Primitive** (`createPrimitiveEventBus`): Dynamic event names at runtime. Use for plugins, generic handlers.

## Exports

| Entry | Content |
|-------|---------|
| `@justwant/event` | `defineEvent`, `createEventBus` (typed), `createPrimitiveEventBus` |
| `@justwant/event/primitive` | `createPrimitiveEventBus` (primitive) |

## Contributing

Contributions are welcome. Please open an [issue](https://github.com/elydelva/justwant/issues) or [pull request](https://github.com/elydelva/justwant/pulls) on the [monorepo](https://github.com/elydelva/justwant).

## License

MIT © [elydelva](https://github.com/elydelva)

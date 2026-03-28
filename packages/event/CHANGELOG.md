# @justwant/event

## [0.2.0](https://github.com/elydelva/justwant/compare/event-v0.1.0...event-v0.2.0) (2026-03-28)


### Features

* **cookie, event, crypto, id, adapter, cache, env:** create the fondation of the agnostic ecosystem ([2c0f900](https://github.com/elydelva/justwant/commit/2c0f9002c04f6c2cd16c93b5d52f45f1ef3f40e5))
* update README files across multiple packages to include license badges, installation instructions, and enhanced usage examples. Improve documentation clarity and structure for better user guidance. ([c2846a5](https://github.com/elydelva/justwant/commit/c2846a509d74a3a5fdd01470f2da32704e0cc050))

## 1.0.0

### Major Changes

- - **Path**: `@justwant/event/raw` → `@justwant/event/primitive`
  - **API**: `createRawEventBus` → `createPrimitiveEventBus`

### Minor Changes

- - **API**: `createTypedEventBus` → `createEventBus` (typed), `createEventBus` → `createPrimitiveEventBus` (primitive)
  - **Path**: `@justwant/event/bus` → `@justwant/event/primitive`
  - **Wildcard patterns**: `user.*`, `*` for listen/listenOnce (default: enabled). TypeScript infers payload union. Wildcard `user.*` matches `user.created`, `user.updated` but NOT bare `user`
  - **String literals**: `emit("user.created", ...)` and `listen("user.created", (p) => ...)` with autocomplete and typed args/payload
- Initial release. Typed event bus with defineEvent and createEventBus (root). Primitive createPrimitiveEventBus under /primitive. emit, listen, listenOnce, unlisten. Wildcard patterns (user._, _). Async handler support. Zero dependencies.

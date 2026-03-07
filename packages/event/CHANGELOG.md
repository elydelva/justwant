# @justwant/event

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

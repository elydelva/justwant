# @justwant/context

## [1.0.0](https://github.com/elydelva/justwant/compare/context-v0.2.0...context-v1.0.0) (2026-03-28)


### ⚠ BREAKING CHANGES

* **organisation:** multi-type support, standard helpers, organisations list

### Features

* **context:** initial release of modular context with explicit propagation and typed slots ([bd78a93](https://github.com/elydelva/justwant/commit/bd78a93c0f561df7c1e4fac7b354f0c9923077f9))
* **cron, refereal, waitlist, actor, bezier, flag, preference:** initiale realease ([9dcaacb](https://github.com/elydelva/justwant/commit/9dcaacb2636630250b9549154877a5fe4947c2e8))
* **membership:** initial release of member–group liaison functionality ([b2344f0](https://github.com/elydelva/justwant/commit/b2344f01170e12e8179e8c2ce0d2abf61174d539))
* **organisation:** multi-type support, standard helpers, organisations list ([f3ff5da](https://github.com/elydelva/justwant/commit/f3ff5da1c79c61bf456aabefd906da3f52a2df0c))
* update README files across multiple packages to include license badges, installation instructions, and enhanced usage examples. Improve documentation clarity and structure for better user guidance. ([c2846a5](https://github.com/elydelva/justwant/commit/c2846a509d74a3a5fdd01470f2da32704e0cc050))

## 0.3.0

### Breaking Changes

- `createContext` renamed to `createContextService`

## 0.2.0

### Minor Changes

- bd78a93: Initial release: modular context with explicit propagation. defineSlot, createContext, typed slots (lazy/on-demand/eager), per-instance cache. No AsyncLocalStorage. Node, Edge, Bun, Deno.

## 0.1.0

### Minor Changes

- Initial release: modular context with explicit propagation. defineSlot, createContext, typed slots (lazy/on-demand/eager), per-instance cache. No AsyncLocalStorage. Node, Edge, Bun, Deno.

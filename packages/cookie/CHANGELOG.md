# @justwant/cookie

## [0.2.1](https://github.com/elydelva/justwant/compare/cookie-v0.2.0...cookie-v0.2.1) (2026-03-28)


### Bug Fixes

* **sonar:** fix all 40 SonarQube MAJOR (medium) issues ([d902d86](https://github.com/elydelva/justwant/commit/d902d861e5157de270fa6147eedc9fb51b02594d))

## [0.2.0](https://github.com/elydelva/justwant/compare/cookie-v0.1.0...cookie-v0.2.0) (2026-03-28)


### Features

* **cookie, event, crypto, id, adapter, cache, env:** create the fondation of the agnostic ecosystem ([2c0f900](https://github.com/elydelva/justwant/commit/2c0f9002c04f6c2cd16c93b5d52f45f1ef3f40e5))

## 0.1.0

### Minor Changes

- - **defineCookie**: Standard Schema support (Zod, Valibot), `default` fallback, `onMismatch` ("fallback" | "remove")
  - **createCookieStore**: `pruneUntracked` option to delete cookies not in schema (requires adapter)
  - **TypedCookie**: `parseWithMeta()` returns `{ value, remove? }` for onMismatch=remove
- Initial release. Typed cookie parse/serialize. Root: parseCookies, setCookie, deleteCookie, defineCookie, createCookieStore. /primitive: parseCookies, serializeCookie. Adapters (DocumentAdapter, HeaderAdapter, RequestResponseAdapter, NextJSAdapter, ExpressAdapter) for document.cookie, fetch, Next.js App Router, Express. Store get/set sync via adapter.

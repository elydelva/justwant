# @justwant/cookie

## 0.1.0

### Minor Changes

- - **defineCookie**: Standard Schema support (Zod, Valibot), `default` fallback, `onMismatch` ("fallback" | "remove")
  - **createCookieStore**: `pruneUntracked` option to delete cookies not in schema (requires adapter)
  - **TypedCookie**: `parseWithMeta()` returns `{ value, remove? }` for onMismatch=remove
- Initial release. Typed cookie parse/serialize. Root: parseCookies, setCookie, deleteCookie, defineCookie, createCookieStore. /primitive: parseCookies, serializeCookie. Adapters (DocumentAdapter, HeaderAdapter, RequestResponseAdapter, NextJSAdapter, ExpressAdapter) for document.cookie, fetch, Next.js App Router, Express. Store get/set sync via adapter.

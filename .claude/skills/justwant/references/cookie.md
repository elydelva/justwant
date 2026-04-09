# @justwant/cookie

Typed, schema-validated cookie parse/serialize. Works in any runtime (browser, Node, edge).

## Install

```bash
bun add @justwant/cookie
```

## defineCookie

```ts
import { defineCookie } from "@justwant/cookie";
import { z } from "zod";

// Simple — inline parser function
const theme = defineCookie("theme", (v) => (v === "dark" ? "dark" : "light"));

// With options object
const session = defineCookie("session", {
  schema: z.string().min(1),   // Standard Schema (Zod, Valibot, etc.)
  default: "",
  onMismatch: "remove",        // delete cookie when validation fails
});
```

### DefineCookieOptions\<T\>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schema` | `CookieSchema<T>` | — | Standard Schema validator (Zod, Valibot, etc.) |
| `default` | `T` | — | Fallback value when cookie is absent or invalid |
| `onMismatch` | `"fallback" \| "remove"` | `"fallback"` if default is set | What to do on validation failure |
| `parser` | `(value: string \| undefined) => T` | — | Custom parse function (alternative to schema) |

`defineCookie` also accepts a plain function as the second argument (shorthand for `parser`).

### TypedCookie\<T\>

| Member | Type | Description |
|--------|------|-------------|
| `name` | `string` | Cookie name |
| `default` | `T \| undefined` | Configured default |
| `onMismatch` | `OnMismatch \| undefined` | Configured mismatch strategy |
| `parse(raw)` | `(string \| undefined) => T` | Parse raw string to typed value |
| `parseWithMeta(raw)` | `(string \| undefined) => { value: T; remove?: boolean }` | Parse + whether adapter should delete the cookie |

## CookieOptions

Used by `setCookie`, `deleteCookie`, and `CookieStore.serialize`.

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string` | Cookie path |
| `domain` | `string` | Cookie domain |
| `maxAge` | `number` | Max-Age in seconds |
| `expires` | `Date` | Expiry date |
| `httpOnly` | `boolean` | HttpOnly flag |
| `secure` | `boolean` | Secure flag |
| `sameSite` | `"strict" \| "lax" \| "none"` | SameSite attribute |

## createCookieStore

```ts
import { createCookieStore, defineCookie } from "@justwant/cookie";
import { DocumentAdapter } from "@justwant/cookie";

const theme = defineCookie("theme", { default: "light" });
const session = defineCookie("session", { schema: z.string(), onMismatch: "remove" });

const store = createCookieStore({ theme, session });

// Parse from Cookie header string
const parsed = store.parse(request.headers.get("Cookie"));
// { theme: "light", session: "..." }

// Serialize for Set-Cookie header
response.headers.set("Set-Cookie", store.serialize("theme", "dark", { path: "/" }));

// With adapter (enables get/set)
const store2 = createCookieStore({ theme, session }, {
  adapter: new DocumentAdapter(document),
  pruneUntracked: true,
});
store2.set("theme", "dark");
const values = store2.get();
```

### CreateCookieStoreOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adapter` | `CookieAdapter` | — | Enables `store.get()` and `store.set()` |
| `pruneUntracked` | `boolean \| Pick<CookieOptions, "path" \| "domain">` | `false` | Delete cookies not in the store schema on `get()`. Pass `true` for `path: "/"` or an object for custom path/domain. |

### CookieStore\<T\> methods

| Method | Description |
|--------|-------------|
| `parse(header)` | Parse Cookie header string → `InferCookieStore<T>` |
| `serialize(name, value, options?)` | Serialize a single cookie → Set-Cookie string |
| `get()` | Read all cookies via adapter (only when adapter is set) |
| `set(name, value, options?)` | Write a cookie via adapter (only when adapter is set) |

## Adapters

| Adapter | Environment | Description |
|---------|-------------|-------------|
| `DocumentAdapter` | Browser | Reads/writes `document.cookie` |
| `NextJSAdapter` | Next.js server components | Wraps Next.js `cookies()` store |
| `RequestResponseAdapter` | Any server | Reads from `Request`, writes to `Response` headers |
| `HeaderAdapter` | Any | Works with raw header strings |
| `ExpressAdapter` | Express.js | Reads from `req.cookies`, writes via `res.cookie` |

```ts
import {
  DocumentAdapter,
  NextJSAdapter,
  RequestResponseAdapter,
  HeaderAdapter,
  ExpressAdapter,
} from "@justwant/cookie";
```

`CookieAdapter` interface: `{ read(): string; write(name, value, options?): void }`

## Primitive utilities

```ts
import { parseCookies, setCookie, deleteCookie } from "@justwant/cookie";

// Parse Cookie header → Record<name, value>
const cookies = parseCookies(request.headers.get("Cookie"));

// Build a Set-Cookie string
const header = setCookie("session", "abc123", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 86400,
});

// Build a delete Set-Cookie string (maxAge: 0)
const del = deleteCookie("session", { path: "/" });
```

`deleteCookie` accepts `Pick<CookieOptions, "path" | "domain">` only.

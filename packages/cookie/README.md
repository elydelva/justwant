# @justwant/cookie

[![npm version](https://img.shields.io/npm/v/@justwant/cookie.svg)](https://www.npmjs.com/package/@justwant/cookie)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Typed cookie parse/serialize. Root = typed API. `/primitive` = parseCookies, serializeCookie.

## Installation

```bash
bun add @justwant/cookie
# or
npm install @justwant/cookie
# or
pnpm add @justwant/cookie
```

## Usage — @justwant/cookie (typed, default)

```ts
import {
  parseCookies,
  setCookie,
  deleteCookie,
  defineCookie,
  createCookieStore,
} from "@justwant/cookie";

// Parse Cookie header
const cookies = parseCookies(request.headers.get("Cookie"));
cookies.session; // string | undefined

// Serialize for Set-Cookie
response.headers.set(
  "Set-Cookie",
  setCookie("session", "abc123", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 86400,
    path: "/",
  })
);

// Delete cookie
response.headers.append("Set-Cookie", deleteCookie("session", { path: "/" }));

// Typed store — parser shorthand
const theme = defineCookie("theme", (v) => (v === "dark" ? "dark" : "light"));
const session = defineCookie("session");
const store = createCookieStore({ theme, session });

// Or with Standard Schema (Zod, Valibot) + default + pruneUntracked
import { z } from "zod";
const theme = defineCookie("theme", {
  schema: z.enum(["light", "dark"]),
  default: "light",
  onMismatch: "fallback", // or "remove" to delete invalid cookie
});
const store = createCookieStore({ theme, session }, {
  pruneUntracked: true, // delete cookies not in schema (requires adapter)
});

const parsed = store.parse(request.headers.get("Cookie"));
parsed.theme; // "light" | "dark"
parsed.session; // string

response.headers.set("Set-Cookie", store.serialize("theme", "dark"));
```

## Adapters — source/destination sync

Use adapters to read from and write to a specific backend. The store stays in sync via `get()` and `set()`.

```ts
import {
  defineCookie,
  createCookieStore,
  DocumentAdapter,
  HeaderAdapter,
  RequestResponseAdapter,
  NextJSAdapter,
  ExpressAdapter,
} from "@justwant/cookie";

const theme = defineCookie("theme", (v) => (v === "dark" ? "dark" : "light"));
const session = defineCookie("session");

// Browser — document.cookie
const store = createCookieStore({ theme, session }, {
  adapter: DocumentAdapter(),
});
store.get();        // reads from document.cookie
store.set("theme", "dark");  // writes to document.cookie

// Fetch Request + Response
const store = createCookieStore({ theme, session }, {
  adapter: RequestResponseAdapter(request, response),
});

// Next.js App Router (v15+ cookies() is async)
import { cookies } from "next/headers";
const cookieStore = await cookies();
const store = createCookieStore({ theme, session }, {
  adapter: NextJSAdapter(cookieStore),
});

// Express
const store = createCookieStore({ theme, session }, {
  adapter: ExpressAdapter(req, res),
});

// Generic headers
const store = createCookieStore({ theme, session }, {
  adapter: HeaderAdapter({
    getCookie: () => request.headers.get("Cookie") ?? "",
    appendSetCookie: (v) => response.headers.append("Set-Cookie", v),
  }),
});

// Or import only the adapter you need (tree-shaking)
import { NextJSAdapter } from "@justwant/cookie/adapters/nextjs";
```

### defineCookie options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schema` | Standard Schema | — | Zod, Valibot, etc. for validation |
| `default` | T | — | Fallback when undefined or validation fails |
| `onMismatch` | `"fallback"` \| `"remove"` | `"fallback"` when default set | `fallback` = use default; `remove` = use default + delete cookie |
| `parser` | `(v) => T` | — | Custom parser (alternative to schema) |

### createCookieStore options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adapter` | CookieAdapter | — | Read/write backend (document, headers, etc.) |
| `pruneUntracked` | `boolean` \| `{ path?, domain? }` | `false` | Delete cookies not in schema on get (requires adapter) |

## Usage — @justwant/cookie/primitive

For low-level usage without typed store:

```ts
import { parseCookies, serializeCookie } from "@justwant/cookie/primitive";

const cookies = parseCookies(header);
const setCookieValue = serializeCookie("name", "value", {
  path: "/",
  maxAge: 3600,
});
```

## Exports

| Entry | Content |
|-------|---------|
| `@justwant/cookie` | `parseCookies`, `setCookie`, `deleteCookie`, `defineCookie`, `createCookieStore`, adapters |
| `@justwant/cookie/primitive` | `parseCookies`, `serializeCookie` |
| `@justwant/cookie/adapters/document` | `DocumentAdapter` |
| `@justwant/cookie/adapters/header` | `HeaderAdapter` |
| `@justwant/cookie/adapters/request-response` | `RequestResponseAdapter` |
| `@justwant/cookie/adapters/nextjs` | `NextJSAdapter`, `NextJSCookieStore` |
| `@justwant/cookie/adapters/express` | `ExpressAdapter` |

## License

MIT © [elydelva](https://github.com/elydelva)

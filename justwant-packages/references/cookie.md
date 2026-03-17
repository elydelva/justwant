# @justwant/cookie

Typed cookie parse/serialize. parseCookies, setCookie, deleteCookie, defineCookie, createCookieStore.

## Usage

```ts
import { parseCookies, setCookie, deleteCookie, defineCookie, createCookieStore } from "@justwant/cookie";

const cookies = parseCookies(request.headers.get("Cookie"));
response.headers.set("Set-Cookie", setCookie("session", "abc123", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400 }));

const theme = defineCookie("theme", (v) => (v === "dark" ? "dark" : "light"));
const store = createCookieStore({ theme, session });
const parsed = store.parse(request.headers.get("Cookie"));
response.headers.set("Set-Cookie", store.serialize("theme", "dark"));
```

## Adapters

DocumentAdapter, HeaderAdapter, RequestResponseAdapter, NextJSAdapter, ExpressAdapter

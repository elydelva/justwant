# @justwant/env

[![npm version](https://img.shields.io/npm/v/@justwant/env.svg)](https://www.npmjs.com/package/@justwant/env)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Typed, validated, and safe environment variable loading. File sources: `.env`, `.env.local`, `.env.production`, etc.

**No validator dependency** — uses [Standard Schema](https://standardschema.dev/) to accept Zod, Valibot, Arktype, Typebox, or any compatible validator.

## Installation

```bash
bun add @justwant/env zod
# or
npm install @justwant/env zod
# or
pnpm add @justwant/env zod
```

> Use `zod`, `valibot`, `arktype`, or any [Standard Schema](https://standardschema.dev/) compatible validator.

## Minimal usage

```ts
import { createEnv } from "@justwant/env";
import { z } from "zod";

export const env = createEnv({
  vars: {
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DEBUG: z.coerce.boolean().default(false),
  },
});

env.DATABASE_URL; // string — typed, validated, autocompleted
env.PORT;         // number — coerced from string
env.DEBUG;        // boolean
```

## Supported validators

```ts
// With Zod
import { z } from "zod";
createEnv({ vars: { PORT: z.coerce.number() } });

// With Valibot
import * as v from "valibot";
createEnv({ vars: { PORT: v.pipe(v.string(), v.transform(Number)) } });

// With Arktype
import { type } from "arktype";
createEnv({ vars: { PORT: type("number") } });
```

## Runtime compatibility

| Runtime | File loading | Watch |
|---------|--------------|-------|
| Node.js, Bun | ✅ | ✅ |
| Cloudflare Workers, Vercel Edge, Deno Deploy | ❌ | ❌ |

**Two entry points:**
- `@justwant/env` — Node/Bun (files, watch). Uses `fs` and `node:path`.
- `@justwant/env/edge` — Edge runtimes (no `fs`). Use `processEnv` or `inline` only.

Conditional exports (`edge`, `worker`, `edge-light`, `workerd`) are defined so bundlers that pass these conditions will auto-resolve. **Next.js/Turbopack does not yet support custom conditions** — use `@justwant/env/edge` explicitly for Edge routes.

> **How does dotenv do it?** dotenv is Node-only — it uses `fs` and fails in edge. Frameworks like Next.js load `.env` at build time and inject into `process.env`, so at runtime there's no file I/O.

For Cloudflare Workers (no `process.env`), pass your env object:

```ts
// Cloudflare Workers — use /edge when bundler doesn't pass worker conditions
import { createEnv } from "@justwant/env/edge";
import { z } from "zod";

export default {
  fetch(req, env) {
    const config = createEnv({
      vars: { API_KEY: z.string() },
      sources: {
        processEnv: env,  // ctx.env when process.env is unavailable
      },
    });
    // ...
  },
};
```

## Sources

```ts
createEnv({
  vars: { ... },
  sources: {
    files: [".env", ".env.local", `.env.${process.env.NODE_ENV}`],
    processEnv: true,
    inline: { DATABASE_URL: "postgres://localhost/test" },
  },
  cwd: "/app",
});
```

Priority (lowest to highest):
`.env` < `.env.local` < `.env.{NODE_ENV}` < `process.env` < `inline`

## Groups

```ts
createEnv({
  groups: {
    db: { URL: z.string().url(), POOL_MIN: z.coerce.number().default(2) },
    redis: { URL: z.string().url(), TTL: z.coerce.number().default(3600) },
  },
  groupSeparator: "_",
});

env.db.URL;      // string
env.redis.TTL;   // number
```

## Prefixes (Next.js, Vite)

```ts
createEnv({
  vars: { API_URL: z.string().url() },
  clientPrefix: "NEXT_PUBLIC_",
});
// Reads NEXT_PUBLIC_API_URL, exposes env.API_URL
```

## defineEnv — for libraries

```ts
// @justwant/audit
export const auditEnv = defineEnv({
  vars: {
    AUDIT_SECRET: z.string().min(32),
    AUDIT_RETENTION: z.string().default("90d"),
  },
});

// App
const env = createEnv({
  vars: { ...auditEnv.vars, DATABASE_URL: z.string().url() },
});
```

## include — merge envs (Next.js client/server)

Two patterns to avoid redundancy between server and client env.

### Pattern A — defineEnv for both

Define client and server separately, then combine with `createEnv`:

```ts
// lib/env.ts
import { createEnv, defineEnv } from "@justwant/env";
import { z } from "zod";

const clientEnv = defineEnv({
  vars: {
    API_URL: z.string().url(),
    FEATURE_FLAG: z.string().optional(),
  },
  clientPrefix: "NEXT_PUBLIC_",
});

const serverEnv = defineEnv({
  vars: {
    DATABASE_URL: z.string().url(),
    API_SECRET: z.string().min(32),
  },
});

// Server: client + server (import only in API routes, Server Components, etc.)
export const env = createEnv({
  include: [clientEnv, serverEnv],
});

// Client: client only (safe to import anywhere)
export const publicEnv = createEnv({
  include: [clientEnv],
});
```

### Pattern B — defineEnv for client, inline server vars

Define only client with `defineEnv`, add server vars directly in `createEnv`:

```ts
// lib/env.ts
import { createEnv, defineEnv } from "@justwant/env";
import { z } from "zod";

const clientEnv = defineEnv({
  vars: {
    API_URL: z.string().url(),
    FEATURE_FLAG: z.string().optional(),
  },
  clientPrefix: "NEXT_PUBLIC_",
});

// Server: include client + inline server vars
export const env = createEnv({
  include: [clientEnv],
  vars: {
    DATABASE_URL: z.string().url(),
    API_SECRET: z.string().min(32),
  },
});

// Client: client only
export const publicEnv = createEnv({
  include: [clientEnv],
});
```

- **Pattern A** — symmetric, server vars reusable (e.g. in tests). More files if server env is shared.
- **Pattern B** — shorter, server vars stay local to the app.

## API

- `env.get(key, fallback?)` — optional access with fallback
- `env.has(key)` — check existence
- `env.raw(key)` — raw string value before validation
- `env.toJSON()` — snapshot of values (with redaction if configured)

## References

- [Node.js Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports) — `import`, `require`, `node`, `default`; custom conditions via `--conditions`
- [WinterCG Runtime Keys](https://runtime-keys.proposal.wintercg.org/) — `edge-light` (Vercel), `workerd` (Cloudflare), `deno`, etc.
- [Next.js: Turbopack custom conditions](https://github.com/vercel/next.js/discussions/78912) — no built-in support for custom `resolvePackageExports` conditions
- [Wrangler build conditions](https://github.com/cloudflare/workers-sdk/pull/6743) — `WRANGLER_BUILD_CONDITIONS` for custom package export resolution

---

## Contributing

Contributions are welcome. Please open an [issue](https://github.com/elydelva/justwant/issues) or [pull request](https://github.com/elydelva/justwant/pulls) on the [monorepo](https://github.com/elydelva/justwant).

## License

MIT © [elydelva](https://github.com/elydelva)

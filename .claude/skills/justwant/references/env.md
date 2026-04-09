# @justwant/env

Typed, validated environment variables. `@standard-schema/spec` compatible (Zod, Valibot, ArkType).

## Install

```bash
bun add @justwant/env zod
```

Auto-reads `.env`, `.env.local`, `.env.{NODE_ENV}`, `.env.{NODE_ENV}.local` — no dotenv needed.

## Imports

```ts
import { createEnv, defineEnv, EnvironmentError } from "@justwant/env";        // Node/Bun
import { createEnv, defineEnv, EnvironmentError } from "@justwant/env/edge";   // Edge (no fs/watch)
```

Edge build resolves automatically under `edge-light`, `workerd`, `edge`, or `worker` conditions.

## createEnv

```ts
import { createEnv } from "@justwant/env";
import { z } from "zod";

export const env = createEnv({
  vars: {
    PORT: z.string().transform(Number),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    SECRET_KEY: z.string().min(32),
  },
});

env.PORT          // number
env.DATABASE_URL  // string
```

### createEnv options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vars` | `EnvSchema` | `{}` | Variable schemas (record of standard-schema validators) |
| `groups` | `GroupSchema` | — | Namespaced groups (reads `GROUP_KEY`, accesses `env.group.key`) |
| `groupSeparator` | `string` | `"_"` | Separator between group prefix and key |
| `include` | `EnvInclude[]` | `[]` | Reusable blocks from `defineEnv` |
| `sources.files` | `string[]` | auto | `.env` files to load |
| `sources.processEnv` | `boolean \| Record<string,string>` | `true` | Use `process.env` or a custom object |
| `sources.inline` | `Record<string,string>` | — | Hard-coded values (highest priority) |
| `cwd` | `string` | `process.cwd()` | Base directory for resolving env files |
| `expand` | `boolean` | `true` | Expand `${VAR}` references |
| `clientPrefix` | `string \| string[]` | — | Strip prefix when reading env (e.g. `"NEXT_PUBLIC_"`) |
| `modes` | `Record<string, (string \| number \| symbol)[]>` | — | Required keys per mode |
| `mode` | `string` | `NODE_ENV` | Active mode |
| `redact` | `string[] \| RegExp` | — | Keys to hide in `toJSON()` as `"[redacted]"` |
| `validation.onError` | `"throw" \| "warn" \| "silent" \| false` | `"throw"` | Error handling |
| `validation.skip` | `boolean` | `false` | Skip validation entirely |
| `validation.reporter` | `(issues) => void` | — | Custom issue reporter |
| `watch` | `boolean` | `false` | Watch files for changes (Node/Bun only) |
| `onReload` | `(changed: string[]) => void` | — | Called on file change |

## Groups

```ts
const env = createEnv({
  groups: {
    db: { host: z.string(), port: z.string().transform(Number) },
    redis: { url: z.string().url() },
  },
});

env.db.host    // reads DB_HOST
env.db.port    // reads DB_PORT
env.redis.url  // reads REDIS_URL
```

## EnvProxy methods

| Method | Description |
|--------|-------------|
| `env.get("KEY", fallback?)` | Dynamic typed access; dot notation for groups (`"db.host"`) |
| `env.has("KEY")` | Boolean presence check |
| `env.raw("KEY")` | Raw string before validation |
| `env.toJSON()` | Plain object; sensitive keys redacted if `redact` is set |

## defineEnv — Reusable blocks

```ts
// lib/client-env.ts
export const clientEnv = defineEnv({
  vars: { APP_NAME: z.string(), ANALYTICS_ID: z.string() },
  clientPrefix: "NEXT_PUBLIC_",
});

// lib/server-env.ts
export const env = createEnv({
  include: [clientEnv],
  vars: { DATABASE_URL: z.string().url(), SECRET_KEY: z.string().min(32) },
});
```

## EnvironmentError

```ts
class EnvironmentError extends Error {
  readonly issues: { key: string; message: string }[];
}
```

Thrown at module load time when `validation.onError === "throw"` (default).

## Edge usage (Cloudflare Workers)

```ts
import { createEnv } from "@justwant/env/edge";

export function getEnv(workerEnv: Record<string, string>) {
  return createEnv({
    vars: { DATABASE_URL: z.string().url(), API_KEY: z.string().min(16) },
    sources: { processEnv: workerEnv },
  });
}
```

## Edge vs Node/Bun differences

| Feature | Node/Bun | Edge |
|---------|----------|------|
| `.env` file loading | Yes | No |
| `watch` / `onReload` | Yes | No (silently ignored) |
| `process.env` | Yes | Yes (when available) |
| `sources.processEnv` object | Yes | Yes |
| Variable expansion | Yes | Yes |
| Groups, validation, redaction | Yes | Yes |

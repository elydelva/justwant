# @justwant/config

Multi-source config with waterfall resolution, typed validation, environment switching.

## Install

```bash
bun add @justwant/config
# Optional: add a Standard Schema validator
bun add zod
```

## Imports

```ts
import {
  createConfigService,
  defineEnvironment,
  defineValue,
  defineEnvSource,
  defineJsonSource,
  defineDatabaseSource,
} from "@justwant/config";
import type { ConfigSource, ConfigApi, ValueDef, SourcesMap, EnvironmentDef } from "@justwant/config";
```

## Sources

### defineEnvSource

```ts
const env = defineEnvSource({ prefix: "APP_" }); // reads APP_PORT, APP_DATABASE_URL, etc.
const testEnv = defineEnvSource({ env: { DATABASE_URL: "postgres://localhost/test" } });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | `string` | `""` | Prepended to every key before lookup |
| `env` | `Record<string, string \| undefined>` | `process.env` | Custom env object |

Empty strings treated as missing (waterfall continues).

### defineJsonSource

```ts
const json = defineJsonSource({ path: "config.json" });           // file (dot-notation paths)
const json2 = defineJsonSource({ data: { db: { url: "..." } } }); // inline object
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | `string` | — | Path to JSON file |
| `data` | `Record<string, unknown>` | — | Inline object (takes precedence over `path`) |
| `cwd` | `string` | `process.cwd()` | Base dir for resolving `path` |

File is read once and cached. Use dot notation for nested keys: `defineValue({ from: json, path: "database.url" })`.

### defineDatabaseSource

```ts
const db = defineDatabaseSource({ repo: configRepo });
```

`configRepo` must implement:
```ts
interface ConfigRepo {
  findOne(where: { key: string }): Promise<{ key: string; value: unknown } | null>;
}
```

### Custom source

Implement `ConfigSource`:
```ts
interface ConfigSource {
  get(lookup: SourceLookup): unknown; // may return Promise
}
```

## defineValue

```ts
defineValue({ from: env, key: "DATABASE_URL" })            // key-based
defineValue({ from: json, path: "database.url" })          // path-based (dot notation)
defineValue({ from: json, path: "auth", field: "secret" }) // path + field
```

## defineEnvironment

```ts
import { z } from "zod";

const production = defineEnvironment({
  name: "production",
  sources: {
    databaseUrl: defineValue({ from: env, key: "DATABASE_URL" }),
    // Waterfall: env var first, JSON fallback
    port: [
      defineValue({ from: env, key: "PORT" }),
      defineValue({ from: json, path: "port" }),
    ],
  },
  schema: {
    port: z.coerce.number().min(1).max(65535),
  },
});
```

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Unique environment identifier |
| `sources` | `SourcesMap` | Map of keys to `ValueDef` or `ValueDef[]` (waterfall) |
| `schema` | `Record<string, StandardSchemaV1>` | Optional per-key validation (Zod, Valibot, ArkType…) |

## createConfigService

```ts
export const config = createConfigService({
  environments: [production, development],
  defaultEnvironment: process.env.NODE_ENV === "production" ? "production" : "development",
  validation: { onError: "throw" }, // default
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `environments` | `readonly EnvironmentDef[]` | required | One or more environment definitions |
| `defaultEnvironment` | `string` | First environment | Active environment name |
| `validation.onError` | `"throw" \| "warn" \| false` | `"throw"` | Behavior on schema validation failure |

## ConfigApi methods

```ts
const dbUrl = await config.get<string>("databaseUrl");
const port  = await config.get<number>("port", 3000); // fallback when no source resolves
const ok    = await config.has("databaseUrl");         // true if any source resolves it
```

## Errors

| Class | Extends | When thrown | Key properties |
|-------|---------|-------------|----------------|
| `ConfigError` | `Error` | Base class | `message` |
| `ConfigValidationError` | `ConfigError` | Schema fails + `onError: "throw"` | `issues: { key, message }[]` |

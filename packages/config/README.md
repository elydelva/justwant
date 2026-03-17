# @justwant/config

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Multi-source config with ordered merge and strong typing. Define environments, sources, and values; resolve at runtime via waterfall lookup.

## Installation

```bash
bun add @justwant/config
# or
npm install @justwant/config
# or
pnpm add @justwant/config
```

## Usage

```ts
import {
  createConfigService,
  defineEnvironment,
  defineValue,
} from "@justwant/config";
import { defineEnvSource } from "@justwant/config/sources";

const envSource = defineEnvSource();

const prod = defineEnvironment({
  name: "production",
  sources: {
    databaseUrl: defineValue({ from: envSource, key: "DATABASE_URL" }),
    apiKey: [
      defineValue({ from: envSource, key: "API_KEY" }),
      defineValue({ from: envSource, key: "FALLBACK_KEY" }), // waterfall fallback
    ],
  },
});

const config = createConfigService({
  environments: [prod],
  defaultEnvironment: "production",
});

const dbUrl = await config.get<string>("databaseUrl");
const apiKey = await config.get("apiKey", "default"); // typed fallback
const hasKey = await config.has("apiKey");
```

## Sources

Config supports multiple sources. Use `defineEnvSource` from `@justwant/config/sources` for env vars, or implement custom `ConfigSource`.

```ts
import { defineEnvSource } from "@justwant/config/sources";

const envSource = defineEnvSource();
// Reads from process.env
```

## Standard Schema validation

Config supports [Standard Schema](https://github.com/standard-schema/standard-schema) for runtime validation. Pass a `schema` map (key → `StandardSchemaV1`) in `defineEnvironment`; values are validated on `get()`.

```ts
import { z } from "zod"; // or valibot, arktype, etc.

const prod = defineEnvironment({
  name: "production",
  sources: { port: defineValue({ from: envSource, key: "PORT" }) },
  schema: {
    port: z.coerce.number().min(1).max(65535),
  },
});
```

Invalid values throw `ConfigValidationError`. Use `validation: { onError: "warn" }` to log instead of throw.

## Exports

| Path | Description |
|------|-------------|
| `@justwant/config` | createConfigService, defineEnvironment, defineValue, types, errors |
| `@justwant/config/types` | ConfigSource, SourceLookup, ValueDef, EnvironmentDef, SourcesMap |
| `@justwant/config/errors` | ConfigError, ConfigValidationError |
| `@justwant/config/sources` | Source implementations |

## API

| Method | Description |
|--------|-------------|
| `createConfigService(options)` | Create config service with environments |
| `config.get(key, fallback?)` | Get value (typed) |
| `config.has(key)` | Check if key exists |
| `defineEnvironment(options)` | Define environment with sources |
| `defineValue(options)` | Define value with source and key |

## License

MIT

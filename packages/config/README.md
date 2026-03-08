# @justwant/config

Multi-source config with ordered merge and strong typing. Define environments, sources, and values; resolve at runtime via waterfall lookup.

## Installation

```bash
bun add @justwant/config
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

## Exports

| Path | Description |
|------|-------------|
| `@justwant/config` | createConfigService, defineEnvironment, defineValue, types, errors |
| `@justwant/config/types` | ConfigSource, SourceLookup, ValueDef, EnvironmentDef, SourcesMap |
| `@justwant/config/errors` | ConfigError, ConfigValidationError |
| `@justwant/config/sources` | Source implementations |

## License

MIT

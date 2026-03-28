# @justwant/config

Multi-source config, waterfall resolution. defineEnvironment, defineValue, createConfigService.

## Usage

```ts
import { createConfigService, defineEnvironment, defineValue } from "@justwant/config";
import { defineEnvSource } from "@justwant/config/sources";

const prod = defineEnvironment({
  name: "production",
  sources: {
    databaseUrl: defineValue({ from: defineEnvSource(), key: "DATABASE_URL" }),
    apiKey: [defineValue({ from: envSource, key: "API_KEY" }), defineValue({ from: envSource, key: "FALLBACK_KEY" })],
  },
});

const config = createConfigService({ environments: [prod], defaultEnvironment: "production" });
const dbUrl = await config.get<string>("databaseUrl");
const apiKey = await config.get("apiKey", "default");
```

## API

createConfigService, defineEnvironment, defineValue, config.get, config.has

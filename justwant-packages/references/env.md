# @justwant/env

Typed env vars. createEnv with Zod/Valibot. Files: .env, .env.local.

## Usage

```ts
import { createEnv } from "@justwant/env";
import { z } from "zod";

export const env = createEnv({
  vars: {
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
});

env.DATABASE_URL; // typed
```

## Edge

@justwant/env/edge for Cloudflare Workers, Vercel Edge (no fs).

# @justwant/cache

Interface unifiée de cache avec adapters interchangeables. Clé/valeur, TTL, invalidation par tag, namespacing.

## Installation

```bash
bun add @justwant/cache
```

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { namespacePlugin } from "@justwant/cache/plugins/namespace";

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [namespacePlugin({ prefix: "app" })],
  defaults: { ttl: "1h" },
});

await cache.set("user:123", { id: "123", name: "Alice" }, { ttl: "5m", tags: ["user:123"] });
const user = await cache.get("user:123");

await cache.wrap("user:456", () => db.findUser("456"), { ttl: "5m" });
await cache.invalidateTag("user:123");
```

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/cache` | createCache, types |
| `@justwant/cache/entry` | createCacheEntry |
| `@justwant/cache/collection` | createCacheCollection |
| `@justwant/cache/store` | createCacheStore |
| `@justwant/cache/adapters/memory` | In-memory adapter |
| `@justwant/cache/adapters/storage` | Simple Map adapter |
| `@justwant/cache/adapters/redis` | ioredis adapter |
| `@justwant/cache/adapters/upstash` | Upstash Redis adapter |
| `@justwant/cache/adapters/cf-kv` | Cloudflare KV adapter |
| `@justwant/cache/adapters/vercel-kv` | Vercel KV adapter |
| `@justwant/cache/adapters/tiered` | L1 + L2 tiered adapter |
| `@justwant/cache/plugins/namespace` | Key prefix plugin |
| `@justwant/cache/plugins/serialize` | Custom serializer plugin |
| `@justwant/cache/plugins/encrypt` | Encryption plugin |
| `@justwant/cache/plugins/stats` | Hit/miss stats plugin |
| `@justwant/cache/plugins/stale` | Stale-while-revalidate |
| `@justwant/cache/plugins/dedupe` | Concurrent deduplication |
| `@justwant/cache/plugins/prefetch` | Prefetch plugin |
| `@justwant/cache/plugins/audit` | Audit hooks plugin |
| `@justwant/cache/serializers/superjson` | Superjson serializer |
| `@justwant/cache/serializers/msgpack` | MessagePack serializer |

## Typed entries

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { createCacheEntry } from "@justwant/cache/entry";
import * as v from "valibot";

const cache = createCache({ adapter: memoryAdapter() });

const userEntry = createCacheEntry({
  cache,
  key: (id) => `user:${id}`,
  schema: v.object({ id: v.string(), email: v.string() }),
  ttl: "5m",
  tags: (id) => [`user:${id}`, "users"] as const,
});

await userEntry.get("123");  // User | null
await userEntry.set("123", { id: "123", email: "a@b.com" });
await userEntry.wrap("123", () => db.findUser("123"));
```

## License

MIT

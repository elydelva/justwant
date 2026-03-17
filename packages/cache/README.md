# @justwant/cache

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Unified cache interface with interchangeable adapters. Key/value, TTL, tag-based invalidation, namespacing.

## Installation

```bash
bun add @justwant/cache
# or
npm install @justwant/cache
# or
pnpm add @justwant/cache
```

For adapters: `bun add ioredis` (Redis) | `bun add @upstash/redis` (Upstash) | `bun add @cloudflare/kv` (Cloudflare KV)

---

## Usage

### Basic usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";

const cache = createCache({
  adapter: memoryAdapter(),
  defaults: { ttl: "1h" },
});

await cache.set("user:123", { id: "123", name: "Alice" }, { ttl: "5m" });
const user = await cache.get("user:123");

await cache.wrap("user:456", () => db.findUser("456"), { ttl: "5m" });
await cache.delete("user:123");
```

### With tags (invalidation)

```ts
await cache.set("user:123", data, { ttl: "5m", tags: ["user:123", "users"] });
await cache.invalidateTag("user:123"); // Invalidate all keys with this tag
```

### Namespace (isolate keys)

```ts
// Option 1: namespacePlugin
import { namespacePlugin } from "@justwant/cache/plugins/namespace";

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [namespacePlugin({ prefix: "app" })],
});
await cache.set("key", "value"); // Stored as "app:key"

// Option 2: cache.namespace()
const userCache = cache.namespace("users", { ttl: "10m" });
await userCache.set("123", userData); // Stored as "users:123"
```

---

## Adapters

| Adapter | Use case | Dependency |
|---------|----------|------------|
| `memoryAdapter()` | Dev, tests | — |
| `storageAdapter(storage)` | Custom Map-like | — |
| `redisAdapter({ client })` | Prod Redis | ioredis |
| `upstashAdapter({ client })` | Upstash Redis | @upstash/redis |
| `cfKvAdapter({ namespace })` | Cloudflare Workers | @cloudflare/kv |
| `vercelKvAdapter({ kv })` | Vercel KV | @vercel/kv |
| `tieredAdapter({ l1, l2 })` | L1 (memory) + L2 (redis) | — |

### Redis adapter

```ts
import { createCache } from "@justwant/cache";
import { redisAdapter } from "@justwant/cache/adapters/redis";
import Redis from "ioredis";

const cache = createCache({
  adapter: redisAdapter({ client: new Redis(process.env.REDIS_URL!) }),
});
```

### Tiered adapter (L1 + L2)

```ts
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { redisAdapter } from "@justwant/cache/adapters/redis";
import { tieredAdapter } from "@justwant/cache/adapters/tiered";

const cache = createCache({
  adapter: tieredAdapter({
    l1: memoryAdapter(),
    l2: redisAdapter({ client: redis }),
  }),
});
// Read: L1 first, on miss read L2 and populate L1
// Write: both L1 and L2
```

---

## Plugins

### namespacePlugin

Prefixes all keys with a namespace.

```ts
import { namespacePlugin } from "@justwant/cache/plugins/namespace";

createCache({
  adapter: memoryAdapter(),
  plugins: [namespacePlugin({ prefix: "app" })],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `prefix` | string | Key prefix (e.g. `"app"` → `"app:key"`) |

### serializePlugin

Replaces the default JSON serializer (e.g. superjson, msgpack).

```ts
import { serializePlugin } from "@justwant/cache/plugins/serialize";
import { superjsonSerializer } from "@justwant/cache/serializers/superjson";

createCache({
  adapter: memoryAdapter(),
  plugins: [serializePlugin({ serializer: superjsonSerializer() })],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `serializer` | CacheSerializer | Custom serialize/deserialize |

### encryptPlugin

Encrypts values at rest. Requires 32-byte key from `@justwant/crypto/derive-key`.

```ts
import { encryptPlugin } from "@justwant/cache/plugins/encrypt";
import { deriveKey } from "@justwant/crypto/derive-key";

const key = deriveKey("master-secret", "salt", "cache", 32);

createCache({
  adapter: memoryAdapter(),
  plugins: [encryptPlugin({ key })],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `key` | Uint8Array | 32-byte encryption key |

### statsPlugin

Tracks hits, misses, sets, deletes, latency. Exposes `cache.stats()`.

```ts
import { statsPlugin } from "@justwant/cache/plugins/stats";

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [statsPlugin()],
});

// After operations
const stats = cache.stats?.();
// { hits, misses, hitRate, sets, deletes, errors, latency: { get: { p50, p95, p99 }, set: {...} } }
```

### stalePlugin

Serves stale values while revalidating in background. Extends effective TTL.

```ts
import { stalePlugin } from "@justwant/cache/plugins/stale";

createCache({
  adapter: memoryAdapter(),
  plugins: [stalePlugin({ staleTtl: "1h" })],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `staleTtl` | string \| number | How long after expiry to serve stale |

### dedupePlugin

Deduplicates concurrent `get` requests for the same key.

```ts
import { dedupePlugin } from "@justwant/cache/plugins/dedupe";

createCache({
  adapter: memoryAdapter(),
  plugins: [dedupePlugin()],
});
```

### prefetchPlugin

Prefetches related keys on get (warms cache).

```ts
import { prefetchPlugin } from "@justwant/cache/plugins/prefetch";

createCache({
  adapter: memoryAdapter(),
  plugins: [
    prefetchPlugin({
      keyFn: (key) => [`${key}:meta`, `${key}:stats`],
      maxKeys: 10,
    }),
  ],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `keyFn` | (key) => string[] | Keys to prefetch when get is called |
| `maxKeys` | number | Max keys to prefetch per get (default: 10) |

### auditPlugin

Hooks for logging, metrics, or compliance.

```ts
import { auditPlugin } from "@justwant/cache/plugins/audit";

createCache({
  adapter: memoryAdapter(),
  plugins: [
    auditPlugin({
      onGet: (key, hit) => console.log("get", key, hit ? "hit" : "miss"),
      onSet: (key) => console.log("set", key),
      onDelete: (key) => console.log("delete", key),
    }),
  ],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `onGet` | (key, hit) => void | Called after get |
| `onSet` | (key) => void | Called after set |
| `onDelete` | (key) => void | Called after delete |

---

## Typed entries (createCacheEntry)

Type-safe cache entries with schema validation.

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

---

## createCache options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adapter` | CacheAdapter | required | Storage backend |
| `plugins` | CachePlugin[] | [] | Plugin pipeline |
| `defaults` | CacheDefaults | — | Default ttl, tags |
| `onError` | "throw" \| "silent" \| "fallback" | "silent" | Error handling |

---

## API

| Method | Description |
|--------|-------------|
| `get(key)` | Get value |
| `set(key, value, opts?)` | Set with optional ttl, tags |
| `delete(key)` | Remove key |
| `has(key)` | Check existence |
| `wrap(key, fn, opts?)` | Get or compute and cache |
| `pull(key)` | Get and delete |
| `setNx(key, value, opts?)` | Set if not exists |
| `getMany(keys)` | Batch get |
| `setMany(entries)` | Batch set |
| `deleteMany(keys)` | Batch delete |
| `wrapMany(keys, fetchMissing, opts?)` | Batch wrap |
| `invalidateTag(tag)` | Invalidate by tag |
| `invalidateTags(tags)` | Invalidate by tags |
| `namespace(prefix, opts?)` | Create namespaced cache |

---

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/cache` | createCache, types |
| `@justwant/cache/entry` | createCacheEntry |
| `@justwant/cache/collection` | createCacheCollection |
| `@justwant/cache/store` | createCacheStore |
| `@justwant/cache/adapters/memory` | In-memory adapter |
| `@justwant/cache/adapters/redis` | ioredis adapter |
| `@justwant/cache/adapters/upstash` | Upstash adapter |
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

## License

MIT

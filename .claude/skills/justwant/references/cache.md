# @justwant/cache

Unified cache: K/V, TTL, tags, namespacing. Adapters + plugins.

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";

const cache = createCache({ adapter: memoryAdapter(), defaults: { ttl: "1h" } });
await cache.set("user:123", data, { ttl: "5m", tags: ["user:123"] });
const v = await cache.get("user:123");
await cache.wrap("user:456", () => db.findUser("456"), { ttl: "5m" });
await cache.invalidateTag("user:123");
const ns = cache.namespace("users", { ttl: "10m" });
```

## Adapters

| Adapter | Import | Dep |
|---------|--------|-----|
| memoryAdapter | adapters/memory | — |
| redisAdapter | adapters/redis | ioredis |
| upstashAdapter | adapters/upstash | @upstash/redis |
| cfKvAdapter | adapters/cf-kv | @cloudflare/kv |
| tieredAdapter({ l1, l2 }) | adapters/tiered | — |

## Plugins

| Plugin | Options | Import |
|--------|---------|--------|
| namespacePlugin | `{ prefix }` | plugins/namespace |
| serializePlugin | `{ serializer }` | plugins/serialize |
| encryptPlugin | `{ key: Uint8Array }` | plugins/encrypt |
| statsPlugin | — | plugins/stats |
| stalePlugin | `{ staleTtl }` | plugins/stale |
| dedupePlugin | — | plugins/dedupe |
| prefetchPlugin | `{ keyFn, maxKeys? }` | plugins/prefetch |
| auditPlugin | `{ onGet, onSet, onDelete }` | plugins/audit |

## createCacheEntry (typed)

```ts
import { createCacheEntry } from "@justwant/cache/entry";

const userEntry = createCacheEntry({
  cache,
  key: (id) => `user:${id}`,
  schema: v.object({ id: v.string(), email: v.string() }),
  ttl: "5m",
  tags: (id) => [`user:${id}`, "users"] as const,
});
await userEntry.get("123");
await userEntry.set("123", data);
await userEntry.wrap("123", () => db.findUser("123"));
```

## createCache options

| Option | Type | Default |
|--------|------|---------|
| adapter | CacheAdapter | required |
| plugins | CachePlugin[] | [] |
| defaults | { ttl?, tags? } | — |
| onError | "throw"\|"silent"\|"fallback" | "silent" |

## API

get, set, delete, has, wrap, pull, setNx, getMany, setMany, deleteMany, wrapMany, invalidateTag, invalidateTags, namespace

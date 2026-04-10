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

| Adapter | Import | Notes |
|---------|--------|-------|
| `memoryAdapter` | `adapters/memory` | in-process |
| `storageAdapter(storage)` | `adapters/storage` | Web Storage (`localStorage`/`sessionStorage`) |
| `redisAdapter` | `adapters/redis` | ioredis-compatible client |
| `upstashAdapter` | `adapters/upstash` | @upstash/redis client |
| `cfKvAdapter` | `adapters/cf-kv` | Cloudflare KV namespace |
| `vercelKvAdapter` | `adapters/vercel-kv` | Vercel KV client |
| `tieredAdapter({ l1, l2 })` | `adapters/tiered` | multi-layer (L1 + L2) |

All adapters are also re-exported from `@justwant/cache/adapters` (barrel).

## Plugins

| Plugin | Options | Import |
|--------|---------|--------|
| `namespacePlugin` | `{ prefix }` | `plugins/namespace` |
| `serializePlugin` | `{ serializer }` | `plugins/serialize` |
| `encryptPlugin` | `{ key: Uint8Array }` | `plugins/encrypt` |
| `statsPlugin` | — | `plugins/stats` |
| `stalePlugin` | `{ staleTtl }` | `plugins/stale` |
| `dedupePlugin` | — | `plugins/dedupe` |
| `prefetchPlugin` | `{ keyFn, maxKeys? }` | `plugins/prefetch` |
| `auditPlugin` | `{ onGet, onSet, onDelete }` | `plugins/audit` |

All plugins are also re-exported from `@justwant/cache/plugins` (barrel).

## createCacheEntry (typed, schema-validated)

```ts
import { createCacheEntry } from "@justwant/cache/entry";

const userEntry = createCacheEntry({
  cache,
  key: (id) => `user:${id}`,
  schema: v.object({ id: v.string(), email: v.string() }),
  ttl: "5m",
  tags: (id) => [`user:${id}`, "users"],
});
await userEntry.get("123");          // T | null
await userEntry.set("123", data);
await userEntry.wrap("123", () => db.findUser("123"));
await userEntry.has("123");
await userEntry.delete("123");
```

Schema uses Standard Schema (`@standard-schema/spec`) — compatible with valibot, zod, etc.

## createCacheCollection (namespaced group of typed entries)

```ts
import { createCacheCollection } from "@justwant/cache/collection";

const col = createCacheCollection({
  cache,
  namespace: "users",
  entries: {
    profile: { key: (id) => `profile:${id}`, schema: profileSchema, ttl: "10m" },
    settings: { key: (id) => `settings:${id}`, schema: settingsSchema },
  },
});
await col.profile.get("123");
await col.settings.set("123", data);
await col.invalidate("123"); // invalidates namespace tag for that id
```

## createCacheStore (multi-arg key, flat schema map)

```ts
import { createCacheStore } from "@justwant/cache/store";

const store = createCacheStore({
  cache,
  schema: {
    session: {
      key: (userId, sessionId) => `session:${userId}:${sessionId}`,
      schema: sessionSchema,
      ttl: "30m",
      tags: (userId) => [`user:${userId}`],
    },
  },
});
await store.session.get(userId, sessionId);
await store.session.set(value, userId, sessionId);
await store.invalidateTag(`user:${userId}`);
```

## createCache options

| Option | Type | Default |
|--------|------|---------|
| `adapter` | `CacheAdapter` | required |
| `plugins` | `CachePlugin[]` | `[]` |
| `defaults` | `{ ttl?, tags?, serialize? }` | `{ ttl: "1h", tags: [], serialize: true }` |
| `onError` | `"throw" \| "silent" \| "fallback"` | `"silent"` |

## API

`get`, `set`, `delete`, `has`, `wrap`, `pull`, `setNx`, `ttl`, `expire`, `persist`, `getMany`, `setMany`, `deleteMany`, `wrapMany`, `invalidateTag`, `invalidateTags`, `getTagKeys`, `namespace`, `stats?`

### TTL formats

`TTL = string | number | Date` — strings: `"30s"`, `"5m"`, `"2h"`, `"7d"`. Numbers are milliseconds. Date is absolute expiry.

## Errors

`CacheError`, `CacheAdapterError` — exported from `@justwant/cache`.

# cache statsPlugin

**Package:** @justwant/cache  
**Import:** `@justwant/cache/plugins/stats`

Track hits, misses, sets, deletes, errors, latences. Expose `cache.stats()`.

## Cas d'usage

- Monitoring / dashboards
- Détection de dégradation (hitRate, latency p99)
- Alerting sur erreurs

## Options

Aucune.

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { statsPlugin } from "@justwant/cache/plugins/stats";

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [statsPlugin()],
});

// Après opérations
const stats = cache.stats?.();
// { hits, misses, hitRate, sets, deletes, errors, latency: { get: { p50, p95, p99 }, set: { p50, p95, p99 } } }
```

## Structure CacheStats

| Champ | Type |
|-------|------|
| hits | number |
| misses | number |
| hitRate | number |
| sets | number |
| deletes | number |
| errors | number |
| latency.get | { p50, p95, p99 } |
| latency.set | { p50, p95, p99 } |

## Hooks

- init: setStats(fn)
- get, set, delete: mesure latence et incrémente compteurs

## Notes

- `cache.stats` est optionnel (peut être undefined si plugin non utilisé)

# cache auditPlugin

**Package:** @justwant/cache  
**Import:** `@justwant/cache/plugins/audit`

Hooks pour logging, métriques ou conformité sur les opérations cache.

## Cas d'usage

- Conformité / audit trail
- Métriques custom (export Prometheus, Datadog)
- Debug / tracing

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| onGet | (key: string, hit: boolean) => void \| Promise<void> | non | Appelé après get. hit=true si valeur trouvée |
| onSet | (key: string) => void \| Promise<void> | non | Appelé après set |
| onDelete | (key: string) => void \| Promise<void> | non | Appelé après delete |

Toutes optionnelles. Par défaut: {}.

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { auditPlugin } from "@justwant/cache/plugins/audit";

const cache = createCache({
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

## Hooks

- get: appelle onGet(key, v !== null) après next
- set: appelle onSet(key) après next
- delete: appelle onDelete(key) après next

## Notes

- Aucune dépendance externe

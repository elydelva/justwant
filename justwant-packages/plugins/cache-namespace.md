# cache namespacePlugin

**Package:** @justwant/cache  
**Import:** `@justwant/cache/plugins/namespace`

Préfixe toutes les clés avec un namespace. Alternative à `cache.namespace()` quand le namespace doit faire partie du pipeline de plugins.

## Cas d'usage

- Multi-tenant : isolation des clés par tenant
- Environnements : staging vs prod sur le même Redis
- Versioning : préfixe par version d'app

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| prefix | string | oui | Préfixe des clés (ex: `"app"` → clés stockées comme `"app:key"`) |

Si `prefix` ne se termine pas par `:`, un `:` est ajouté automatiquement.

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { namespacePlugin } from "@justwant/cache/plugins/namespace";

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [namespacePlugin({ prefix: "app" })],
});

await cache.set("key", "value"); // Stocké comme "app:key"
const v = await cache.get("key"); // Lit "app:key"
```

## Hooks interceptés

- get, set, delete, has — tous les opérations passent par le préfixe

## Notes

- Aucune dépendance externe

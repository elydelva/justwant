# cache dedupePlugin

**Package:** @justwant/cache  
**Import:** `@justwant/cache/plugins/dedupe`

Déduplique les requêtes get concurrentes pour la même clé. Une seule requête backend par clé en vol.

## Cas d'usage

- Pics de charge : 100 requêtes simultanées pour la même clé → 1 seule requête backend
- Réduction de la charge sur Redis/Upstash lors de hot paths

## Options

Aucune.

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { dedupePlugin } from "@justwant/cache/plugins/dedupe";

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [dedupePlugin()],
});
```

## Comportement

- get: si une requête pour la même clé est déjà en cours, attend et retourne le même résultat
- Utilise un Map in-memory des Promises en vol
- Nettoie le Map après résolution (finally)

## Pièges

- **In-memory uniquement** : ne déduplique pas entre instances (plusieurs workers = dédupe par instance seulement)

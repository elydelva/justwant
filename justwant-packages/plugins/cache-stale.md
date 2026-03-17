# cache stalePlugin

**Package:** @justwant/cache  
**Import:** `@justwant/cache/plugins/stale`

Sert les valeurs stale pendant la revalidation en arrière-plan. Prolonge le TTL effectif.

## Cas d'usage

- Réduction de la charge backend sur expiration
- Meilleure latence perçue (servir stale plutôt qu'attendre)

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| staleTtl | string \| number | oui | Durée après expiration pendant laquelle servir stale |

Format string: "1h", "5m", "30s" (parsé par parseTtl).

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { stalePlugin } from "@justwant/cache/plugins/stale";

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [stalePlugin({ staleTtl: "1h" })],
});
```

## Comportement

- get: retourne la valeur même si expirée (stale)
- set: passe through
- Note: l'implémentation actuelle est un pass-through; le comportement stale-while-revalidate dépend de l'adapter (Redis, etc.)

## Pièges

- Le comportement réel dépend de l'adapter. Redis et adapters avec support stale-while-revalidate l'exploitent ; memory non.

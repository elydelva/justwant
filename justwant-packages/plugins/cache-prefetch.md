# cache prefetchPlugin

**Package:** @justwant/cache  
**Import:** `@justwant/cache/plugins/prefetch`

Précharge les clés liées lors d'un get. Réchauffe le cache sans retourner les valeurs préchargées.

## Cas d'usage

- Données liées : get("user:123") → précharge "user:123:meta", "user:123:stats"
- Réduction des round-trips pour les patterns de lecture groupée

## Options

| Option | Type | Default | Requis | Description |
|--------|------|---------|--------|-------------|
| keyFn | (key: string) => string[] | — | **oui** | Clés à précharger quand get est appelé |
| maxKeys | number | 10 | non | Max clés à précharger par get |

Sans keyFn, le plugin est un no-op.

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { prefetchPlugin } from "@justwant/cache/plugins/prefetch";

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [
    prefetchPlugin({
      keyFn: (key) => [`${key}:meta`, `${key}:stats`],
      maxKeys: 10,
    }),
  ],
});
```

## Comportement

- get: après avoir récupéré la valeur demandée, appelle next() pour les clés liées (fire-and-forget)
- Ne bloque pas le get principal
- Les erreurs des précharges sont ignorées (catch)

## Pièges

- keyFn requis : sans keyFn, le plugin ne fait rien

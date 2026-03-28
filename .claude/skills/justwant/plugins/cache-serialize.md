# cache serializePlugin

**Package:** @justwant/cache  
**Import:** `@justwant/cache/plugins/serialize`

Remplace le sérialiseur JSON par défaut (ex: superjson, msgpack).

## Cas d'usage

- Dates, Map, Set, BigInt : superjson préserve les types
- Binaire / taille : msgpack plus compact que JSON

## Dépendances

- superjson : `@justwant/cache/serializers/superjson` — peer: `superjson`
- msgpack : `@justwant/cache/serializers/msgpack` — peer: `@msgpack/msgpack`

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| serializer | CacheSerializer | oui | Custom serialize/deserialize |

CacheSerializer: `{ serialize: (v: unknown) => string; deserialize: (s: string) => unknown }`

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { serializePlugin } from "@justwant/cache/plugins/serialize";
import { superjsonSerializer } from "@justwant/cache/serializers/superjson";

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [serializePlugin({ serializer: superjsonSerializer() })],
});
```

## Serializers disponibles

- `@justwant/cache/serializers/superjson` — superjsonSerializer()
- `@justwant/cache/serializers/msgpack` — msgpackSerializer()

## Hooks

- init — appelle context.setSerializer(serializer)

## Notes

- Doit être placé avant encryptPlugin si les deux sont utilisés (serialize → encrypt)

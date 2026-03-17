# storage multiBucketPlugin

**Package:** @justwant/storage  
**Import:** `@justwant/storage/plugins/multiBucket`

Route les uploads vers différents buckets selon contentType ou extension.

## Cas d'usage

- Séparation images / documents / backups
- Buckets par région ou par niveau de criticité
- Coûts différenciés (S3 Standard vs Glacier)

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| routing | Record<string, StorageBucket> | **oui** | Map pattern → bucket |
| defaultBucket | StorageBucket | recommandé | Bucket si aucun pattern ne matche |

## Patterns

| Pattern | Exemple | Match |
|---------|---------|-------|
| `image/*` | image/jpeg, image/png | contentType commence par "image/" |
| `application/pdf` | application/pdf | contentType exact |
| `*.jpg` | .jpg | Extension du path |

## Usage

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { multiBucketPlugin } from "@justwant/storage/plugins/multiBucket";

const defaultBucket = defineBucket({ source: mySource, name: "default" });
const storage = createStorageService({
  buckets: [defaultBucket, imagesBucket, documentsBucket],
  defaultBucket,
  plugins: [
    multiBucketPlugin({
      routing: {
        "image/*": imagesBucket,
        "application/pdf": documentsBucket,
        "*.jpg": imagesBucket,
      },
      defaultBucket: defaultBucket,
    }),
  ],
});
```

## Comportement

- upload: parcourt les patterns, appelle next avec le bucket correspondant
- Si aucun match et pas de defaultBucket → Error
- L'ordre des entrées dans routing compte (premier match gagne)

## Pièges

- **Tous les buckets** utilisés dans routing doivent être dans `buckets` de createStorageService

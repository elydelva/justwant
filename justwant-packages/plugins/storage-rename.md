# storage renamePlugin

**Package:** @justwant/storage  
**Import:** `@justwant/storage/plugins/rename`

Sanitize le chemin et applique une stratégie de nommage (uuid, hash, slug).

## Cas d'usage

- uuid : URLs non devinables, éviter les collisions
- hash : déduplication (même fichier = même path), cache-friendly
- slug : URLs lisibles (SEO, partage)

## Options

| Option | Type | Default | Requis | Description |
|--------|------|---------|--------|-------------|
| sanitize | boolean | true | non | Nettoie les caractères invalides (<>:"|?*, doubles slashes) |
| strategy | "uuid" \| "hash" \| "slug" | — | non | Stratégie de nommage du fichier |

## Stratégies

| Stratégie | Comportement |
|-----------|--------------|
| uuid | Remplace le nom par un UUID, garde l'extension |
| hash | SHA256 des données (16 premiers caractères) + extension. Déterministe. |
| slug | Slugify le nom (lowercase, tirets), garde l'extension |

## Usage

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { renamePlugin } from "@justwant/storage/plugins/rename";

const bucket = defineBucket({ source: mySource, name: "media" });
const storage = createStorageService({
  buckets: [bucket],
  defaultBucket: bucket,
  plugins: [
    renamePlugin({ sanitize: true }),
    renamePlugin({ strategy: "uuid" }),   // ex: dir/abc123-uuid.jpg
    renamePlugin({ strategy: "hash" }),   // ex: dir/a1b2c3d4e5f6.jpg
    renamePlugin({ strategy: "slug" }),   // ex: dir/my-cool-image.jpg
  ],
});
```

## Sanitize

- Remplace `<>:"|?*` par `_`
- Collapse les `/` multiples
- Trim les slashes début/fin

## Ordre des plugins (storage)

Pour upload : placer rename avant encryption (sanitize/rename le path avant chiffrement). Voir [README.md](./README.md#ordre-des-plugins-storage).

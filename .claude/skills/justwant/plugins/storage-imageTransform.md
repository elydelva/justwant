# storage imageTransformPlugin

**Package:** @justwant/storage  
**Import:** `@justwant/storage/plugins/imageTransform`

Redimensionne, convertit le format et ajuste la qualité des images via sharp.

## Dépendances

- **Peer:** `sharp` (optionnel — si absent, pass-through silencieux)

## Cas d'usage

- Réduction taille stockage (webp, avif)
- Limite dimensions (max 1920px)
- Normalisation format upload utilisateur

## Options

| Option | Type | Default | Requis | Description |
|--------|------|---------|--------|-------------|
| maxWidth | number | — | non | Largeur max (fit: inside, withoutEnlargement) |
| maxHeight | number | — | non | Hauteur max |
| format | "webp" \| "avif" \| "jpeg" \| "png" | — | non | Format de sortie |
| quality | number | 80 | non | Qualité (webp, avif, jpeg) |

## Content types supportés

image/jpeg, image/png, image/gif, image/webp, image/avif, image/svg+xml, image/bmp, image/tiff

## Usage

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { imageTransformPlugin } from "@justwant/storage/plugins/imageTransform";

const bucket = defineBucket({ source: mySource, name: "media" });
const storage = createStorageService({
  buckets: [bucket],
  defaultBucket: bucket,
  plugins: [
    imageTransformPlugin({
      maxWidth: 1920,
      maxHeight: 1080,
      format: "webp",
      quality: 85,
    }),
  ],
});
```

## Comportement

- upload: si contentType est image, utilise sharp pour resize + convert
- Si sharp n'est pas installé → pass-through (pas d'erreur)
- Met à jour path (extension) et options.contentType selon le format
- Les non-images passent through sans modification

## Pièges

- **Pass-through silencieux** si sharp absent : pas d'erreur, les images ne sont pas transformées

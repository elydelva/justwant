# storage watermarkPlugin

**Package:** @justwant/storage  
**Import:** `@justwant/storage/plugins/watermark`

Ajoute des paramètres de transformation aux URLs d'images (Cloudflare Images, imgproxy).

## Cas d'usage

- Thumbnails, resize à la volée
- Watermarking pour preview
- Optimisation bande passante (quality)

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| provider | "cloudflare" \| "imgproxy" | **oui** | Backend de transformation |
| cloudflare | object | non | fit, width, height, quality (query params) |
| imgproxy | object | non | w, h, resize, wm (path segments) |

## Extensions supportées

.jpg, .jpeg, .png, .gif, .webp, .avif, .svg, .bmp, .ico

## Usage

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { watermarkPlugin } from "@justwant/storage/plugins/watermark";

const bucket = defineBucket({ source: mySource, name: "media" });
const storage = createStorageService({
  buckets: [bucket],
  defaultBucket: bucket,
  plugins: [
    watermarkPlugin({
      provider: "cloudflare",
      cloudflare: { fit: "cover", width: 400, height: 300, quality: 80 },
    }),
    // ou
    watermarkPlugin({
      provider: "imgproxy",
      imgproxy: { w: 400, h: 300, resize: "fill", wm: "..." },
    }),
  ],
});
```

## Comportement

- getUrl: si le path est une image, modifie l'URL retournée pour ajouter les params
- Cloudflare: ajoute ?fit=...&width=...&height=...&quality=...
- imgproxy: ajoute /w:400/h:300/rs:fill/wm:... au pathname
- Les chemins non-image passent through sans modification

## Notes

- Nécessite que la source (S3, R2, etc.) soit configurée pour Cloudflare Images ou imgproxy

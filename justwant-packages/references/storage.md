# @justwant/storage

File storage: upload, download, delete, getUrl, getSignedUrl. Sources + plugins.

## Usage

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { defineLocalSource } from "@justwant/storage/local";

const local = defineLocalSource({ rootDir: "./uploads" });
const bucket = defineBucket({ source: local, name: "media" });
const storage = createStorageService({ buckets: [bucket], defaultBucket: bucket });

await storage.upload({ path: "avatars/user-123.png", data: buffer });
const buf = await storage.download({ path: "avatars/user-123.png" });
const url = await storage.getUrl({ path: "avatars/user-123.png" });
await storage.delete({ path: "avatars/user-123.png" });
```

## Sources

| Source | Import |
|--------|--------|
| defineLocalSource | storage/local |
| defineS3Source | storage/s3 |
| defineR2Source | storage/r2 |
| defineVercelBlobSource | storage/vercel-blob |
| defineSupabaseStorageSource | storage/supabase-storage |

## Plugins

| Plugin | Options | Import |
|--------|---------|--------|
| signedUrlPlugin | `{ defaultExpiresIn?, defaultMethod? }` | plugins/signedUrl |
| renamePlugin | `{ sanitize?, strategy?: "uuid"\|"hash"\|"slug" }` | plugins/rename |
| multiBucketPlugin | `{ routing, defaultBucket? }` | plugins/multiBucket |
| watermarkPlugin | `{ provider, cloudflare?, imgproxy? }` | plugins/watermark |
| encryptionPlugin | `{ key, algorithm? }` | plugins/encryption |
| imageTransformPlugin | `{ maxWidth?, maxHeight?, format?, quality? }` | plugins/imageTransform |

multiBucketPlugin routing patterns: `"image/*"`, `"application/pdf"`, `"*.jpg"`

## API

upload, download, delete, getUrl, getSignedUrl, exists

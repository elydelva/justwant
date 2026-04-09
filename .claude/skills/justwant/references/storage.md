# @justwant/storage

Unified file storage: upload, download, delete, getUrl, getSignedUrl. Sources + plugins.

## Usage

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { defineLocalSource } from "@justwant/storage/local";

const local = defineLocalSource({ rootDir: "./uploads" });
const bucket = defineBucket({ source: local, name: "media" });
const storage = createStorageService({ buckets: [bucket], defaultBucket: bucket });

const result = await storage.upload({
  path: "avatars/user-123.png",
  data: buffer,
  options: { contentType: "image/png" },
});
const buf = await storage.download({ path: "avatars/user-123.png" });
const url = await storage.getUrl({ path: "avatars/user-123.png" });
const signed = await storage.getSignedUrl({ path: "avatars/user-123.png", options: { expiresIn: 3600 } });
await storage.delete({ path: "avatars/user-123.png" });
const ok = await storage.exists({ path: "avatars/user-123.png" });
```

## Sources

| Source | Import | Notes |
|--------|--------|-------|
| `defineLocalSource` | `storage/local` | local filesystem |
| `defineS3Source` | `storage/s3` | AWS S3 |
| `defineR2Source` | `storage/r2` | Cloudflare R2 |
| `defineVercelBlobSource` | `storage/vercel-blob` | Vercel Blob |
| `defineSupabaseStorageSource` | `storage/supabase-storage` | Supabase Storage |

## Plugins

| Plugin | Options | Import |
|--------|---------|--------|
| `signedUrlPlugin` | `{ defaultExpiresIn?, defaultMethod? }` | `plugins/signedUrl` |
| `renamePlugin` | `{ sanitize?, strategy?: "uuid" \| "hash" \| "slug" }` | `plugins/rename` |
| `multiBucketPlugin` | `{ routing, defaultBucket? }` | `plugins/multiBucket` |
| `watermarkPlugin` | `{ provider, cloudflare?, imgproxy? }` | `plugins/watermark` |
| `encryptionPlugin` | `{ key, algorithm? }` | `plugins/encryption` |
| `imageTransformPlugin` | `{ maxWidth?, maxHeight?, format?, quality? }` | `plugins/imageTransform` |

`multiBucketPlugin` routing patterns: `"image/*"`, `"application/pdf"`, `"*.jpg"`.

## createStorageService options

| Option | Type | Default |
|--------|------|---------|
| `buckets` | `StorageBucket[]` | required |
| `defaultBucket` | `StorageBucket` | — |
| `plugins` | `StoragePlugin[]` | `[]` |
| `onError` | `"throw" \| "silent"` | — |

## Upload result

`UploadResult` — `{ path: string; url?: string; size?: number; etag?: string }`

## Plugin interface

```ts
interface StoragePlugin {
  name: string;
  init?(ctx: StoragePluginContext): void | Promise<void>;
  upload?(params, next): Promise<UploadResult>;
  download?(params, next): Promise<Buffer>;
  delete?(params, next): Promise<void>;
  getUrl?(params, next): Promise<string>;
  getSignedUrl?(params, next): Promise<string>;
}
```

## API

`upload`, `download`, `delete`, `getUrl`, `getSignedUrl`, `exists`

## Errors

`StorageError`, `StorageAdapterError`, `parseStorageError` — exported from `@justwant/storage`.

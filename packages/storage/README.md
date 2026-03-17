# @justwant/storage

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Unified file storage abstraction. Upload, download, delete, getUrl, getSignedUrl. Pluggable adapters and plugins.

## Installation

```bash
bun add @justwant/storage
# or
npm install @justwant/storage
# or
pnpm add @justwant/storage
```

For S3/R2: `bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`  
For image transforms: `bun add sharp`

---

## Usage

### Basic usage

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { defineLocalSource } from "@justwant/storage/local";

const local = defineLocalSource({ rootDir: "./uploads" });
const bucket = defineBucket({ source: local, name: "media" });

const storage = createStorageService({
  buckets: [bucket],
  defaultBucket: bucket,
});

const result = await storage.upload({ path: "avatars/user-123.png", data: buffer });
const buffer = await storage.download({ path: "avatars/user-123.png" });
const url = await storage.getUrl({ path: "avatars/user-123.png" });
await storage.delete({ path: "avatars/user-123.png" });
```

### With bucket

```ts
// Specify bucket explicitly
await storage.upload({
  path: "documents/report.pdf",
  data: pdfBuffer,
  bucket: documentsBucket,
});
```

---

## Sources (adapters)

| Source | Use case | Import |
|--------|----------|--------|
| `defineLocalSource` | Local filesystem | `@justwant/storage/local` |
| `defineS3Source` | AWS S3 | `@justwant/storage/s3` |
| `defineR2Source` | Cloudflare R2 | `@justwant/storage/r2` |
| `defineVercelBlobSource` | Vercel Blob | `@justwant/storage/vercel-blob` |
| `defineSupabaseStorageSource` | Supabase Storage | `@justwant/storage/supabase-storage` |

---

## Plugins

### signedUrlPlugin

Default options for `getSignedUrl` (expiresIn, method).

```ts
import { signedUrlPlugin } from "@justwant/storage/plugins/signedUrl";

createStorageService({
  buckets: [bucket],
  plugins: [
    signedUrlPlugin({
      defaultExpiresIn: 3600,  // seconds
      defaultMethod: "GET",    // or "PUT"
    }),
  ],
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultExpiresIn` | number | 3600 | Default expiry in seconds |
| `defaultMethod` | "GET" \| "PUT" | "GET" | HTTP method for signed URL |

### renamePlugin

Sanitizes path and applies naming strategy (uuid, hash, slug).

```ts
import { renamePlugin } from "@justwant/storage/plugins/rename";

createStorageService({
  buckets: [bucket],
  plugins: [
    renamePlugin({
      sanitize: true,
      strategy: "uuid",  // or "hash" | "slug"
    }),
  ],
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sanitize` | boolean | true | Remove invalid chars (`<>:"|?*`), normalize slashes |
| `strategy` | "uuid" \| "hash" \| "slug" | — | **uuid**: random UUID filename. **hash**: SHA256 of content. **slug**: URL-safe slug from name |

### multiBucketPlugin

Routes uploads to different buckets by contentType or file extension.

```ts
import { multiBucketPlugin } from "@justwant/storage/plugins/multiBucket";

createStorageService({
  buckets: [imagesBucket, documentsBucket],
  defaultBucket: documentsBucket,
  plugins: [
    multiBucketPlugin({
      routing: {
        "image/*": imagesBucket,
        "application/pdf": documentsBucket,
        "*.jpg": imagesBucket,
        "*.png": imagesBucket,
      },
      defaultBucket: documentsBucket,
    }),
  ],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `routing` | Record<string, StorageBucket> | Pattern → bucket. Patterns: `"image/*"`, `"application/pdf"`, `"*.jpg"` |
| `defaultBucket` | StorageBucket | Fallback when no pattern matches |

### watermarkPlugin

Adds transformation params to image URLs (Cloudflare Images, imgproxy).

```ts
import { watermarkPlugin } from "@justwant/storage/plugins/watermark";

createStorageService({
  buckets: [bucket],
  plugins: [
    watermarkPlugin({
      provider: "cloudflare",
      cloudflare: { fit: "scale", width: 400, height: 300, quality: 80 },
    }),
  ],
});

// Or imgproxy
watermarkPlugin({
  provider: "imgproxy",
  imgproxy: { w: 400, h: 300, resize: "fit", wm: "logo.png" },
});
```

| Option | Type | Description |
|--------|------|-------------|
| `provider` | "cloudflare" \| "imgproxy" | URL transformation provider |
| `cloudflare` | { fit?, width?, height?, quality? } | Cloudflare Images params |
| `imgproxy` | { w?, h?, resize?, wm? } | imgproxy params |

### encryptionPlugin

Encrypts on upload, decrypts on download (AES-256-GCM).

```ts
import { encryptionPlugin } from "@justwant/storage/plugins/encryption";

createStorageService({
  buckets: [bucket],
  plugins: [
    encryptionPlugin({
      key: "your-32-byte-secret-key!!!!!!!!",
      algorithm: "aes-256-gcm",  // optional
    }),
  ],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `key` | string \| Buffer | Encryption key (string is derived via scrypt) |
| `algorithm` | string | Default: "aes-256-gcm" |

### imageTransformPlugin

Resize, format, quality via sharp (requires `sharp` peer dep).

```ts
import { imageTransformPlugin } from "@justwant/storage/plugins/imageTransform";

createStorageService({
  buckets: [bucket],
  plugins: [
    imageTransformPlugin({
      maxWidth: 1200,
      maxHeight: 800,
      format: "webp",
      quality: 80,
    }),
  ],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `maxWidth` | number | Max width (fit inside, no enlarge) |
| `maxHeight` | number | Max height |
| `format` | "webp" \| "avif" \| "jpeg" \| "png" | Output format |
| `quality` | number | Default: 80 |

---

## Full example (plugin chain)

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { defineLocalSource } from "@justwant/storage/local";
import { signedUrlPlugin } from "@justwant/storage/plugins/signedUrl";
import { renamePlugin } from "@justwant/storage/plugins/rename";
import { multiBucketPlugin } from "@justwant/storage/plugins/multiBucket";
import { encryptionPlugin } from "@justwant/storage/plugins/encryption";

const imagesBucket = defineBucket({ source: local, name: "images" });
const docsBucket = defineBucket({ source: local, name: "documents" });

const storage = createStorageService({
  buckets: [imagesBucket, docsBucket],
  defaultBucket: docsBucket,
  plugins: [
    signedUrlPlugin({ defaultExpiresIn: 3600 }),
    renamePlugin({ sanitize: true, strategy: "uuid" }),
    multiBucketPlugin({
      routing: { "image/*": imagesBucket, "application/pdf": docsBucket },
      defaultBucket: docsBucket,
    }),
    encryptionPlugin({ key: process.env.STORAGE_ENCRYPTION_KEY! }),
  ],
});
```

---

## API

| Method | Description |
|--------|-------------|
| `upload({ path, data, bucket?, options? })` | Upload file |
| `download({ path, bucket? })` | Download file |
| `delete({ path, bucket? })` | Delete file |
| `getUrl({ path, bucket? })` | Get public URL |
| `getSignedUrl({ path, bucket?, options? })` | Get signed URL |
| `exists({ path, bucket? })` | Check if file exists |

---

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/storage` | createStorageService, defineBucket, types, errors |
| `@justwant/storage/local` | Local filesystem source |
| `@justwant/storage/s3` | AWS S3 source |
| `@justwant/storage/r2` | Cloudflare R2 source |
| `@justwant/storage/vercel-blob` | Vercel Blob source |
| `@justwant/storage/supabase-storage` | Supabase Storage source |
| `@justwant/storage/plugins/signedUrl` | Signed URL plugin |
| `@justwant/storage/plugins/rename` | Rename plugin |
| `@justwant/storage/plugins/multiBucket` | Multi-bucket plugin |
| `@justwant/storage/plugins/watermark` | Watermark plugin |
| `@justwant/storage/plugins/encryption` | Encryption plugin |
| `@justwant/storage/plugins/imageTransform` | Image transform plugin (sharp) |

## License

MIT

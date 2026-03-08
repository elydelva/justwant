# @justwant/storage

Unified file storage abstraction. Upload, download, delete, getUrl, getSignedUrl. Pluggable adapters and plugins.

## Installation

```bash
bun add @justwant/storage
```

For S3/R2: `bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`  
For image transforms: `bun add sharp`

## Usage

```ts
import {
  createStorageService,
  defineBucket,
} from "@justwant/storage";
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

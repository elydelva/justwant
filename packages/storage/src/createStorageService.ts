/**
 * Create storage service with buckets and plugins.
 */

import { parseStorageError } from "./errors.js";
import type {
  CreateStorageServiceOptions,
  DeleteParams,
  DownloadParams,
  ExistsParams,
  GetSignedUrlParams,
  GetUrlParams,
  StorageBucket,
  StorageService,
  UploadParams,
  UploadResult,
} from "./types.js";

const bucketSet = (buckets: StorageBucket[]) =>
  new Set(buckets.map((b) => `${b.source._type}:${b.name}`));

function resolveBucket(
  params: { bucket?: StorageBucket },
  defaultBucket: StorageBucket | undefined,
  allowed: Set<string>
): StorageBucket {
  const bucket = params.bucket ?? defaultBucket;
  if (!bucket) throw new Error("No bucket specified and no defaultBucket configured");
  const key = `${bucket.source._type}:${bucket.name}`;
  if (!allowed.has(key)) {
    throw new Error(`Bucket ${bucket.name} is not in the configured buckets`);
  }
  return bucket;
}

function runWithErrorHandling<T>(
  fn: () => Promise<T>,
  onError: "throw" | "silent",
  fallback: T
): Promise<T> {
  return fn().catch((err) => {
    const parsed = parseStorageError(err);
    if (onError === "throw") throw parsed;
    console.error("[@justwant/storage]", parsed);
    return fallback;
  });
}

export function createStorageService(options: CreateStorageServiceOptions): StorageService {
  const { buckets, defaultBucket, plugins = [], onError = "silent" } = options;

  const allowedBuckets = bucketSet(buckets);

  const pluginContext = { setContext: undefined as ((k: string, v: unknown) => void) | undefined };
  for (const plugin of plugins) {
    plugin.init?.(pluginContext);
  }

  function buildUploadChain(): (params: UploadParams) => Promise<UploadResult> {
    let next: (params: UploadParams) => Promise<UploadResult> = (params) => {
      const bucket = resolveBucket(params, defaultBucket, allowedBuckets);
      return bucket._adapter.upload({ ...params, bucket });
    };
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      const upload = p?.upload;
      if (upload) {
        const n = next;
        next = (params) => upload(params, n);
      }
    }
    return next;
  }

  function buildDownloadChain(): (params: DownloadParams) => Promise<Buffer> {
    let next: (params: DownloadParams) => Promise<Buffer> = (params) => {
      const bucket = resolveBucket(params, defaultBucket, allowedBuckets);
      return bucket._adapter.download({ ...params, bucket });
    };
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      const download = p?.download;
      if (download) {
        const n = next;
        next = (params) => download(params, n);
      }
    }
    return next;
  }

  function buildDeleteChain(): (params: DeleteParams) => Promise<void> {
    let next: (params: DeleteParams) => Promise<void> = (params) => {
      const bucket = resolveBucket(params, defaultBucket, allowedBuckets);
      return bucket._adapter.delete({ ...params, bucket });
    };
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      const del = p?.delete;
      if (del) {
        const n = next;
        next = (params) => del(params, n);
      }
    }
    return next;
  }

  function buildGetUrlChain(): (params: GetUrlParams) => Promise<string> {
    let next: (params: GetUrlParams) => Promise<string> = (params) => {
      const bucket = resolveBucket(params, defaultBucket, allowedBuckets);
      return bucket._adapter.getUrl({ ...params, bucket });
    };
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      const getUrl = p?.getUrl;
      if (getUrl) {
        const n = next;
        next = (params) => getUrl(params, n);
      }
    }
    return next;
  }

  function buildGetSignedUrlChain(): (params: GetSignedUrlParams) => Promise<string> {
    let next: (params: GetSignedUrlParams) => Promise<string> = (params) => {
      const bucket = resolveBucket(params, defaultBucket, allowedBuckets);
      return bucket._adapter.getSignedUrl({ ...params, bucket });
    };
    for (let i = plugins.length - 1; i >= 0; i--) {
      const p = plugins[i];
      const getSignedUrl = p?.getSignedUrl;
      if (getSignedUrl) {
        const n = next;
        next = (params) => getSignedUrl(params, n);
      }
    }
    return next;
  }

  const uploadChain = buildUploadChain();
  const downloadChain = buildDownloadChain();
  const deleteChain = buildDeleteChain();
  const getUrlChain = buildGetUrlChain();
  const getSignedUrlChain = buildGetSignedUrlChain();

  const service: StorageService = {
    async upload(params: UploadParams): Promise<UploadResult> {
      return runWithErrorHandling(() => uploadChain(params), onError, { path: params.path });
    },

    async download(params: DownloadParams): Promise<Buffer> {
      return runWithErrorHandling(() => downloadChain(params), onError, Buffer.alloc(0));
    },

    async delete(params: DeleteParams): Promise<void> {
      return runWithErrorHandling(() => deleteChain(params), onError, undefined);
    },

    async getUrl(params: GetUrlParams): Promise<string> {
      return runWithErrorHandling(() => getUrlChain(params), onError, "");
    },

    async getSignedUrl(params: GetSignedUrlParams): Promise<string> {
      return runWithErrorHandling(() => getSignedUrlChain(params), onError, "");
    },

    async exists(params: ExistsParams): Promise<boolean> {
      const bucket = resolveBucket(params, defaultBucket, allowedBuckets);
      const adapter = bucket._adapter;
      const exists = adapter.exists;
      if (!exists) return false;
      return runWithErrorHandling(() => exists({ ...params, bucket }), onError, false);
    },
  };

  return service;
}

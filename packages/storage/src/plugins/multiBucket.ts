/**
 * Plugin multiBucket - route to bucket by contentType or file extension.
 */

import type { StorageBucket, StoragePlugin, StorageUploadNext, UploadParams } from "../types.js";

export interface MultiBucketPluginOptions {
  /** Map pattern to bucket. Patterns: "image/*", "application/pdf", "*.jpg" */
  routing: Record<string, StorageBucket>;
  defaultBucket?: StorageBucket;
}

function matchPattern(pattern: string, contentType: string | undefined, path: string): boolean {
  const ext = path.includes(".") ? path.slice(path.lastIndexOf(".")).toLowerCase() : "";

  if (pattern.startsWith("*.")) {
    const patternExt = pattern.slice(1).toLowerCase();
    return ext === patternExt;
  }

  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -1);
    return contentType?.startsWith(prefix) ?? false;
  }

  return contentType === pattern || ext === `.${pattern}`;
}

export function multiBucketPlugin(options: MultiBucketPluginOptions): StoragePlugin {
  const { routing, defaultBucket } = options;
  const entries = Object.entries(routing);

  return {
    name: "multiBucket",

    upload(params: UploadParams, next: StorageUploadNext) {
      const contentType = params.options?.contentType;
      const path = params.path;

      for (const [pattern, bucket] of entries) {
        if (matchPattern(pattern, contentType, path)) {
          return next({ ...params, bucket });
        }
      }

      if (defaultBucket) {
        return next({ ...params, bucket: defaultBucket });
      }

      throw new Error(
        `No bucket match for contentType=${contentType ?? "undefined"} path=${path} and no defaultBucket`
      );
    },
  };
}

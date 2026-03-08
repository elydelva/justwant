/**
 * Define a storage bucket from a source.
 */

import type { StorageBucket, StorageSource } from "./types.js";

export interface DefineBucketConfig {
  source: StorageSource;
  name: string;
}

/**
 * Creates a logical bucket from a source.
 * - Local: name = subfolder under rootDir
 * - S3/R2: name = bucket name
 * - Vercel Blob: name = path prefix
 */
export function defineBucket(config: DefineBucketConfig): StorageBucket {
  const { source, name } = config;
  return {
    source,
    name,
    _adapter: source._adapter,
  };
}

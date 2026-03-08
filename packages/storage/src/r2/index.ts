/**
 * Cloudflare R2 storage source. S3-compatible API.
 *
 * Peer deps: @aws-sdk/client-s3, @aws-sdk/s3-request-presigner
 */

import { defineS3Source } from "../s3/index.js";
import type { StorageSource } from "../types.js";

export interface DefineR2SourceConfig {
  accountId: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  /** Override endpoint for testing (e.g. MinIO: http://localhost:9000) */
  endpoint?: string;
}

/**
 * Creates an R2 storage source. Uses S3-compatible API with Cloudflare endpoint.
 */
export function defineR2Source(config: DefineR2SourceConfig): StorageSource {
  const { accountId, credentials, endpoint: endpointOverride } = config;
  const endpoint = endpointOverride ?? `https://${accountId}.r2.cloudflarestorage.com`;

  const source = defineS3Source({
    region: "auto",
    credentials,
    endpoint,
    forcePathStyle: true,
  });

  return {
    ...source,
    _type: "r2" as const,
  };
}

/**
 * S3 storage source. Compatible with AWS S3, MinIO, Scaleway.
 *
 * Peer deps: @aws-sdk/client-s3, @aws-sdk/s3-request-presigner
 */

import { createRequire } from "node:module";
import type {
  AdapterDeleteParams,
  AdapterDownloadParams,
  AdapterExistsParams,
  AdapterGetSignedUrlParams,
  AdapterGetUrlParams,
  AdapterUploadParams,
  StorageSource,
  StorageSourceAdapter,
} from "../types.js";

const require = createRequire(import.meta.url);

export interface DefineS3SourceConfig {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  endpoint?: string;
  forcePathStyle?: boolean;
}

async function toBuffer(
  data: Buffer | Blob | ReadableStream<Uint8Array> | string
): Promise<Buffer> {
  if (typeof data === "string") return Buffer.from(data, "utf-8");
  if (data instanceof Buffer) return data;
  if (data instanceof Blob) {
    return Buffer.from(await data.arrayBuffer());
  }
  const stream = data as ReadableStream<Uint8Array>;
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export function defineS3Source(config: DefineS3SourceConfig): StorageSource {
  const { region, credentials, endpoint, forcePathStyle } = config;

  const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } =
    require("@aws-sdk/client-s3");
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

  const client = new S3Client({
    region,
    credentials,
    ...(endpoint && {
      endpoint,
      forcePathStyle: forcePathStyle ?? true,
    }),
  });

  const adapter: StorageSourceAdapter = {
    async upload(
      params: AdapterUploadParams
    ): Promise<{ path: string; etag?: string; size?: number }> {
      const buffer = await toBuffer(params.data);
      const command = new PutObjectCommand({
        Bucket: params.bucket.name,
        Key: params.path,
        Body: buffer,
        ContentType: params.options?.contentType,
        Metadata: params.options?.metadata,
      });
      const result = await client.send(command);
      return {
        path: params.path,
        etag: result.ETag?.replaceAll('"', ""),
        size: buffer.length,
      };
    },

    async download(params: AdapterDownloadParams): Promise<Buffer> {
      const command = new GetObjectCommand({
        Bucket: params.bucket.name,
        Key: params.path,
      });
      const result = await client.send(command);
      const body = result.Body;
      if (!body) return Buffer.alloc(0);
      const chunks: Uint8Array[] = [];
      for await (const chunk of body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    },

    async delete(params: AdapterDeleteParams): Promise<void> {
      const command = new DeleteObjectCommand({
        Bucket: params.bucket.name,
        Key: params.path,
      });
      await client.send(command);
    },

    async getUrl(params: AdapterGetUrlParams): Promise<string> {
      const base = endpoint
        ? `${endpoint.replace(/\/$/, "")}/${params.bucket.name}`
        : `https://${params.bucket.name}.s3.${region}.amazonaws.com`;
      return `${base}/${params.path.replace(/^\//, "")}`;
    },

    async getSignedUrl(params: AdapterGetSignedUrlParams): Promise<string> {
      const method = params.options?.method ?? "GET";
      const expiresIn = params.options?.expiresIn ?? 3600;

      const Command = method === "PUT" ? PutObjectCommand : GetObjectCommand;
      const command = new Command({
        Bucket: params.bucket.name,
        Key: params.path,
      });

      return getSignedUrl(client, command, { expiresIn });
    },

    async exists(params: AdapterExistsParams): Promise<boolean> {
      try {
        const command = new HeadObjectCommand({
          Bucket: params.bucket.name,
          Key: params.path,
        });
        await client.send(command);
        return true;
      } catch {
        return false;
      }
    },
  };

  return {
    _type: "s3",
    _adapter: adapter,
  };
}

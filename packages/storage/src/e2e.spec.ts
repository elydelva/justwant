import { describe, expect, test } from "bun:test";
/**
 * E2E tests against real providers.
 * Requires: MinIO (S3/R2), Supabase local, BLOB_READ_WRITE_TOKEN for Vercel cloud,
 * or vercel-blob-server (docker compose) for Vercel Blob local.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorageService, defineBucket } from "./index.js";
import { defineLocalSource } from "./local/index.js";
import { defineR2Source } from "./r2/index.js";
import { defineS3Source } from "./s3/index.js";
import { defineSupabaseStorageSource } from "./supabase-storage/index.js";
import { defineVercelBlobSource } from "./vercel-blob/index.js";

const MINIO_ENDPOINT = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const MINIO_CREDS = {
  accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
  secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
};

const hasMinIO = async (): Promise<boolean> => {
  try {
    const { S3Client, ListBucketsCommand } = await import("@aws-sdk/client-s3").then(
      (m) => m.default ?? m
    );
    const client = new S3Client({
      endpoint: MINIO_ENDPOINT,
      region: "us-east-1",
      credentials: MINIO_CREDS,
      forcePathStyle: true,
    });
    await client.send(new ListBucketsCommand({}));
    return true;
  } catch {
    return false;
  }
};

const VERCEL_BLOB_LOCAL_URL = "http://localhost:9966";
const VERCEL_BLOB_LOCAL_TOKEN = "vercel_blob_rw_somefakeid_nonce";

const hasVercelBlobLocal = async (): Promise<boolean> => {
  try {
    const res = await fetch(VERCEL_BLOB_LOCAL_URL, { signal: AbortSignal.timeout(1000) });
    return true; // any response means server is up
  } catch {
    return false;
  }
};

const ensureSupabaseBucket = async (
  url: string,
  key: string,
  bucketName: string
): Promise<void> => {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);
  const { error } = await supabase.storage.createBucket(bucketName, { public: true });
  if (error && error.message !== "Bucket already exists") throw error;
};

const createMinioBucket = async (name: string): Promise<void> => {
  const { S3Client, CreateBucketCommand } = await import("@aws-sdk/client-s3").then(
    (m) => m.default ?? m
  );
  const client = new S3Client({
    endpoint: MINIO_ENDPOINT,
    region: "us-east-1",
    credentials: MINIO_CREDS,
    forcePathStyle: true,
  });
  await client.send(new CreateBucketCommand({ Bucket: name }));
};

describe("E2E local", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "e2e-local-"));

  test("full flow with local source", async () => {
    const source = defineLocalSource({ rootDir });
    const bucket = defineBucket({ source, name: "e2e" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    await storage.upload({
      path: "e2e/local.txt",
      data: "local e2e content",
    });
    const downloaded = await storage.download({ path: "e2e/local.txt" });
    expect(downloaded.toString()).toBe("local e2e content");
    await storage.delete({ path: "e2e/local.txt" });
    expect(await storage.exists({ path: "e2e/local.txt" })).toBe(false);
  });
});

describe("E2E S3 (MinIO)", () => {
  test("full flow with S3/MinIO", async () => {
    if (!(await hasMinIO())) {
      console.log("Skipping E2E S3: MinIO not available (run: docker compose up -d)");
      return;
    }
    const bucketName = `e2e-s3-${Date.now()}`;
    await createMinioBucket(bucketName);

    const source = defineS3Source({
      region: "us-east-1",
      credentials: MINIO_CREDS,
      endpoint: MINIO_ENDPOINT,
      forcePathStyle: true,
    });
    const bucket = defineBucket({ source, name: bucketName });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    await storage.upload({
      path: "e2e/s3.txt",
      data: "s3 e2e content",
      options: { contentType: "text/plain" },
    });
    const downloaded = await storage.download({ path: "e2e/s3.txt" });
    expect(downloaded.toString()).toBe("s3 e2e content");

    const url = await storage.getUrl({ path: "e2e/s3.txt" });
    expect(url).toContain(bucketName);

    const signedUrl = await storage.getSignedUrl({
      path: "e2e/s3.txt",
      options: { expiresIn: 60 },
    });
    expect(signedUrl).toContain("X-Amz-");

    await storage.delete({ path: "e2e/s3.txt" });
    expect(await storage.exists({ path: "e2e/s3.txt" })).toBe(false);
  });
});

describe("E2E R2 (MinIO)", () => {
  test("full flow with R2/MinIO", async () => {
    if (!(await hasMinIO())) {
      console.log("Skipping E2E R2: MinIO not available (run: docker compose up -d)");
      return;
    }
    const bucketName = `e2e-r2-${Date.now()}`;
    await createMinioBucket(bucketName);

    const source = defineR2Source({
      accountId: "local",
      credentials: MINIO_CREDS,
      endpoint: MINIO_ENDPOINT,
    });
    const bucket = defineBucket({ source, name: bucketName });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    await storage.upload({
      path: "e2e/r2.txt",
      data: "r2 e2e content",
    });
    const downloaded = await storage.download({ path: "e2e/r2.txt" });
    expect(downloaded.toString()).toBe("r2 e2e content");
    await storage.delete({ path: "e2e/r2.txt" });
  });
});

describe("E2E Vercel Blob", () => {
  test("full flow with Vercel Blob", async () => {
    const useLocal = await hasVercelBlobLocal();
    const hasCloud = process.env.BLOB_READ_WRITE_TOKEN;

    if (!useLocal && !hasCloud) {
      console.log(
        "Skipping E2E Vercel Blob: BLOB_READ_WRITE_TOKEN not set and vercel-blob-server not running (docker compose up -d)"
      );
      return;
    }

    if (useLocal) {
      process.env.VERCEL_BLOB_API_URL = VERCEL_BLOB_LOCAL_URL;
      process.env.BLOB_READ_WRITE_TOKEN = VERCEL_BLOB_LOCAL_TOKEN;
    }

    const source = defineVercelBlobSource({
      token: useLocal ? VERCEL_BLOB_LOCAL_TOKEN : undefined,
    });
    const bucket = defineBucket({ source, name: "e2e-test" });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    const path = `e2e/vercel-${Date.now()}.txt`;
    await storage.upload({
      path,
      data: "vercel blob e2e content",
    });
    const downloaded = await storage.download({ path });
    expect(downloaded.toString()).toBe("vercel blob e2e content");
    await storage.delete({ path });
  });
});

describe("E2E Supabase Storage", () => {
  test("full flow with Supabase Storage", async () => {
    const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!supabaseKey) {
      console.log(
        "Skipping E2E Supabase: SUPABASE_SERVICE_KEY not set (run: ./scripts/ensure-supabase.sh or supabase start)"
      );
      return;
    }
    const bucketName = "e2e-test";
    await ensureSupabaseBucket(supabaseUrl, supabaseKey, bucketName);

    const source = defineSupabaseStorageSource({
      url: supabaseUrl,
      key: supabaseKey,
    });
    const bucket = defineBucket({ source, name: bucketName });
    const storage = createStorageService({
      buckets: [bucket],
      defaultBucket: bucket,
      onError: "throw",
    });

    const path = `e2e/supabase-${Date.now()}.txt`;
    await storage.upload({
      path,
      data: "supabase e2e content",
    });
    const downloaded = await storage.download({ path });
    expect(downloaded.toString()).toBe("supabase e2e content");
    await storage.delete({ path });
  });
});

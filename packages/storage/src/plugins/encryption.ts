/**
 * Plugin encryption - encrypt on upload, decrypt on download.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import type {
  DownloadParams,
  StorageDownloadNext,
  StoragePlugin,
  StorageUploadNext,
  UploadParams,
} from "../types.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
function deriveKey(key: string | Buffer, salt: Buffer): Buffer {
  if (typeof key === "string") {
    return scryptSync(key, salt, KEY_LENGTH);
  }
  return Buffer.isBuffer(key) ? key.slice(0, KEY_LENGTH) : Buffer.from(key);
}

async function toBuffer(
  data: Buffer | Blob | ReadableStream<Uint8Array> | string
): Promise<Buffer> {
  if (typeof data === "string") return Buffer.from(data, "utf-8");
  if (data instanceof Buffer) return data;
  if (data instanceof Blob) return Buffer.from(await data.arrayBuffer());
  const chunks: Uint8Array[] = [];
  const reader = (data as ReadableStream<Uint8Array>).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export interface EncryptionPluginOptions {
  key: string | Buffer;
  algorithm?: string;
}

export function encryptionPlugin(options: EncryptionPluginOptions): StoragePlugin {
  const { key, algorithm = ALGORITHM } = options;

  return {
    name: "encryption",

    async upload(params: UploadParams, next: StorageUploadNext) {
      const plaintext = await toBuffer(params.data);
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);
      const derivedKey = deriveKey(key, salt);

      const cipher = createCipheriv(algorithm, derivedKey, iv);
      const encrypted = Buffer.concat([
        salt,
        iv,
        cipher.update(plaintext),
        cipher.final(),
        (cipher as unknown as { getAuthTag: () => Buffer }).getAuthTag(),
      ]);

      return next({
        ...params,
        data: encrypted,
      });
    },

    async download(params: DownloadParams, next: StorageDownloadNext) {
      const encrypted = await next(params);

      const salt = encrypted.subarray(0, SALT_LENGTH);
      const iv = encrypted.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = encrypted.subarray(encrypted.length - AUTH_TAG_LENGTH);
      const ciphertext = encrypted.subarray(
        SALT_LENGTH + IV_LENGTH,
        encrypted.length - AUTH_TAG_LENGTH
      );

      const derivedKey = deriveKey(key, salt);
      const decipher = createDecipheriv(algorithm, derivedKey, iv);
      (decipher as unknown as { setAuthTag: (tag: Buffer) => void }).setAuthTag(authTag);

      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    },
  };
}

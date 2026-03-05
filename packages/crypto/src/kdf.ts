import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";

/**
 * Derive a key from a secret, salt, and context (HKDF-SHA256). Use for encryption keys, child keys, etc.
 */
export function deriveKey(
  secret: string | Uint8Array,
  salt: string | Uint8Array,
  info: string | Uint8Array,
  length = 32
): Uint8Array {
  const k = typeof secret === "string" ? utf8ToBytes(secret) : secret;
  const s = typeof salt === "string" ? utf8ToBytes(salt) : salt;
  const i = typeof info === "string" ? utf8ToBytes(info) : info;
  return hkdf(sha256, k, s, i, length);
}

import { sha256 } from "@noble/hashes/sha2.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/**
 * Hash a string (e.g. for integrity, cache keys, fingerprints). Returns hex.
 */
export function hashString(str: string): string {
  return bytesToHex(sha256(utf8ToBytes(str)));
}

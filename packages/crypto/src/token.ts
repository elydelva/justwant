import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils.js";
import { timingSafeEqual } from "./timing.js";

const DEFAULT_TOKEN_BYTES = 32;

/**
 * Generate a cryptographically random token (e.g. for magic links, OTP).
 * Returns hex string. Store the result of hashToken(token) in the DB.
 */
export function generateToken(bytes = DEFAULT_TOKEN_BYTES): string {
  return bytesToHex(randomBytes(bytes));
}

/**
 * Generate a short random code (e.g. 6-digit OTP, invite code). Uses a safe alphabet.
 */
export function generateShortCode(length = 6, alphabet = "0123456789"): string {
  const n = alphabet.length;
  if (n === 0 || n > 256) throw new Error("Alphabet must have 1–256 characters");
  let out = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    const byte = bytes[i];
    out += alphabet[(byte ?? 0) % n];
  }
  return out;
}

/**
 * Hash a token for storage. Use verifyToken() to check user input against stored hash (constant-time).
 */
export function hashToken(token: string | Uint8Array): string {
  const bytes = typeof token === "string" ? hexToBytes(token) : token;
  return bytesToHex(sha256(bytes));
}

/**
 * Verify a token against a stored hash (constant-time). Use for magic links, reset tokens, API keys.
 */
export function verifyToken(plainToken: string | Uint8Array, storedHash: string): boolean {
  const computed = hashToken(plainToken);
  if (computed.length !== storedHash.length) return false;
  return timingSafeEqual(hexToBytes(computed), hexToBytes(storedHash));
}

export {
  generateToken as generateSecretCode,
  hashToken as hashForStorage,
  verifyToken as checkToken,
};

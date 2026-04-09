import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { deriveKey } from "./kdf.js";

const NONCE_LEN = 12;
const KEY_LEN = 32;
const SALT_LEN = 16;
const SEP = ".";

function b64urlEncode(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCodePoint(...bytes));
  return b64
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/={1,2}$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replaceAll("-", "+").replaceAll("_", "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  const binary = atob(padded);
  return new Uint8Array([...binary].map((c) => c.codePointAt(0) ?? 0));
}

/**
 * Encrypt a string with a 32-byte key. Returns a single string (nonce included). Use decrypt() to reverse.
 */
export function encrypt(plaintext: string, key: Uint8Array): string {
  if (key.length !== KEY_LEN) throw new Error(`Key must be ${KEY_LEN} bytes`);
  const nonce = randomBytes(NONCE_LEN);
  const aes = gcm(key, nonce);
  const ct = aes.encrypt(utf8ToBytes(plaintext));
  const out = new Uint8Array(NONCE_LEN + ct.length);
  out.set(nonce, 0);
  out.set(ct, NONCE_LEN);
  return b64urlEncode(out);
}

/**
 * Decrypt a string produced by encrypt(). Returns null if invalid.
 */
export function decrypt(ciphertext: string, key: Uint8Array): string | null {
  if (key.length !== KEY_LEN) throw new Error(`Key must be ${KEY_LEN} bytes`);
  try {
    const raw = b64urlDecode(ciphertext);
    if (raw.length < NONCE_LEN + 16) return null;
    const nonce = raw.subarray(0, NONCE_LEN);
    const ct = raw.subarray(NONCE_LEN);
    const aes = gcm(key, nonce);
    const plain = aes.decrypt(ct);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/**
 * Encrypt a string with a password. Salt is random and included in the output. Use decryptWithPassword() to reverse.
 */
export function encryptWithPassword(
  plaintext: string,
  password: string,
  salt?: Uint8Array
): string {
  const s = salt ?? randomBytes(SALT_LEN);
  if (s.length < 8) throw new Error("Salt must be at least 8 bytes");
  const key = deriveKey(password, s, "justwant/encrypt", KEY_LEN);
  const encrypted = encrypt(plaintext, key);
  return `${b64urlEncode(s)}${SEP}${encrypted}`;
}

/**
 * Decrypt a string produced by encryptWithPassword(). Returns null if invalid.
 */
export function decryptWithPassword(ciphertext: string, password: string): string | null {
  const parts = ciphertext.split(SEP);
  if (parts.length !== 2) return null;
  try {
    const [saltB64, encrypted] = parts;
    if (!saltB64 || !encrypted) return null;
    const salt = b64urlDecode(saltB64);
    const key = deriveKey(password, salt, "justwant/encrypt", KEY_LEN);
    return decrypt(encrypted, key);
  } catch {
    return null;
  }
}

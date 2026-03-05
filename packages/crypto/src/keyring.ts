import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes } from "@noble/hashes/utils.js";

const NONCE_LEN = 12;
const KEY_LEN = 32;

export interface Keyring {
  encrypt(plaintext: Uint8Array): Uint8Array;
  decrypt(ciphertext: Uint8Array): Uint8Array | null;
  rotate(): void;
}

/**
 * Create a keyring for encryption with key rotation. Uses AES-256-GCM.
 * First key in the array is the primary (used for encrypt); decrypt tries keys in order.
 */
export function createKeyring(keys: Uint8Array[]): Keyring {
  if (keys.length === 0) throw new Error("Keyring requires at least one key");
  for (const k of keys) {
    if (k.length !== KEY_LEN) throw new Error(`Each key must be ${KEY_LEN} bytes`);
  }

  let keyList = [...keys];

  return {
    encrypt(plaintext: Uint8Array): Uint8Array {
      const key = keyList[0];
      if (!key) throw new Error("Keyring has no keys");
      const nonce = randomBytes(NONCE_LEN);
      const aes = gcm(key, nonce);
      const ciphertext = aes.encrypt(plaintext);
      const out = new Uint8Array(1 + NONCE_LEN + ciphertext.length);
      out[0] = 0; // key index
      out.set(nonce, 1);
      out.set(ciphertext, 1 + NONCE_LEN);
      return out;
    },

    decrypt(ciphertext: Uint8Array): Uint8Array | null {
      if (ciphertext.length < 1 + NONCE_LEN + 16) return null; // min 1 + 12 + 16 (tag)
      const keyIndex = ciphertext[0] ?? 0;
      if (keyIndex >= keyList.length) return null;
      const nonce = ciphertext.subarray(1, 1 + NONCE_LEN);
      const ct = ciphertext.subarray(1 + NONCE_LEN);
      for (let i = keyIndex; i < keyList.length; i++) {
        const key = keyList[i];
        if (!key) continue;
        try {
          const aes = gcm(key, nonce);
          return aes.decrypt(ct);
        } catch {
          // try next key
        }
      }
      return null;
    },

    rotate(): void {
      const newKey = randomBytes(KEY_LEN);
      keyList = [newKey, ...keyList];
    },
  };
}

export { createKeyring as createRotatingEncryption, type Keyring as RotatingEncryption };

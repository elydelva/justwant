# @justwant/crypto

Subpath imports only. No default export, no barrel entry point.

## Install

```bash
bun add @justwant/crypto
```

## Subpaths

| Subpath | Canonical exports | Aliases |
|---------|-------------------|---------|
| `/password` | `hashPassword`, `verifyPassword` | — |
| `/token` | `generateToken`, `generateShortCode`, `hashToken`, `verifyToken` | `generateSecretCode`, `hashForStorage`, `checkToken` |
| `/jwt` | `encodeJwt`, `decodeJwt` | `createJwt`, `verifyJwt` |
| `/sign` | `sign`, `verify` | `signMessage`, `verifySignedMessage` |
| `/encrypt` | `encrypt`, `decrypt`, `encryptWithPassword`, `decryptWithPassword` | — |
| `/hash` | `hashString` | — |
| `/derive-key` | `deriveKey` | — |
| `/compare` | `timingSafeEqual`, `secureCompareStrings` | `secureCompare` |
| `/rotating-encryption` | `createKeyring` | `createRotatingEncryption` |
| `/primitives` | `sha256`, `sha512`, `hmac`, `hkdf`, `gcm`, `chacha20poly1305`, `randomBytes`, `bytesToHex`, `hexToBytes`, `utf8ToBytes` | — |

## /password — Argon2id

```ts
import { hashPassword, verifyPassword } from "@justwant/crypto/password";

const hash = await hashPassword("hunter2");  // PHC string
const ok = await verifyPassword("hunter2", hash); // boolean
```

Fixed params: Argon2id, 3 iterations, 64 MiB, 1 thread.

## /token — Secure tokens

```ts
import { generateToken, generateShortCode, hashToken, verifyToken } from "@justwant/crypto/token";

const token = generateToken();          // 64-char hex (32 bytes default)
const otp = generateShortCode(6);       // "482917" (numeric, default alphabet)
const hash = hashToken(token);          // SHA-256 hex — store this
const ok = verifyToken(token, hash);    // constant-time boolean
```

## /jwt — HS256 JWT

```ts
import { encodeJwt, decodeJwt } from "@justwant/crypto/jwt";

const token = await encodeJwt({ sub: "usr_1", role: "admin" }, secret, { expIn: 3600 });
const payload = await decodeJwt<{ sub: string }>(token, secret); // null if invalid/expired
```

### JwtEncodeOptions

| Field | Type | Description |
|-------|------|-------------|
| `expIn` | `number` | Expiry in seconds from now |
| `iat` | `number` | Override issued-at timestamp |

## /sign — JWS (no expiry)

```ts
import { sign, verify } from "@justwant/crypto/sign";

const jws = await sign({ event: "user.created" }, secret);
const payload = await verify<{ event: string }>(jws, secret); // null if invalid
```

Use for webhook signing. No `exp`/`iat` claims — use `/jwt` for time-bounded tokens.

## /encrypt — AES-256-GCM

```ts
import { encrypt, decrypt, encryptWithPassword, decryptWithPassword } from "@justwant/crypto/encrypt";

// Key must be exactly 32 bytes (Uint8Array)
const ciphertext = encrypt("john@example.com", key);        // Base64url nonce+ciphertext
const plaintext = decrypt(ciphertext, key);                  // string | null

// Password-based (HKDF-SHA256 key derivation, salt included in output)
const ct = encryptWithPassword("data", "my-password");
const pt = decryptWithPassword(ct, "my-password");           // string | null
```

## /hash — SHA-256

```ts
import { hashString } from "@justwant/crypto/hash";

const hex = hashString("user@example.com"); // 64-char lowercase hex
```

Not for passwords. Use for cache keys, content checksums, email fingerprints.

## /derive-key — HKDF-SHA256

```ts
import { deriveKey } from "@justwant/crypto/derive-key";

const key = deriveKey(
  process.env.MASTER_SECRET!, // string | Uint8Array
  "production",               // salt
  "encrypt/user-pii",         // info (scopes purpose)
  32                          // output length bytes (default: 32)
); // Uint8Array(32)
```

Deterministic — same inputs always produce the same key. Do not store derived keys.

## /compare — Constant-time

```ts
import { timingSafeEqual, secureCompareStrings } from "@justwant/crypto/compare";

timingSafeEqual(a, b);         // Uint8Array, Uint8Array → boolean
secureCompareStrings(a, b);    // string, string → boolean
```

## /rotating-encryption — Key rotation keyring

```ts
import { createKeyring } from "@justwant/crypto/rotating-encryption";

const keyring = createKeyring([primaryKey, legacyKey]); // Uint8Array[], first = primary
const ct = keyring.encrypt(plaintext);   // Uint8Array — includes key-index byte + nonce
const pt = keyring.decrypt(ct);          // Uint8Array | null

keyring.rotate(); // generates new random key, prepends as primary
```

Old ciphertexts remain decryptable after rotation. Throws if keys is empty or any key is not 32 bytes.

## /primitives — Low-level @noble re-exports

```ts
import { sha256, hmac, hkdf, gcm, randomBytes } from "@justwant/crypto/primitives";
```

Sources: `@noble/hashes` (sha256, sha512, hmac, hkdf, randomBytes, bytesToHex, hexToBytes, utf8ToBytes) and `@noble/ciphers` (gcm, chacha20poly1305).

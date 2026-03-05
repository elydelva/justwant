# @justwant/crypto

Simple, opinionated crypto for apps: passwords (Argon2id), tokens, JWT, encrypt/decrypt, and signing. Built on audited libraries (**argon2**, **jose**, **@noble/hashes**, **@noble/ciphers**). No default export — use subpath imports only.

## Install

```bash
bun add @justwant/crypto
# or
npm i @justwant/crypto
```

## Requirements

- **Node 18+** for `hashPassword` / `verifyPassword` (argon2 native bindings). Other APIs are runtime-agnostic (Edge, Bun, Deno).

## Usage

Import only what you need. All names are “friendly” (no crypto jargon in the main API).

### Passwords (Argon2id)

```ts
import { hashPassword, verifyPassword } from "@justwant/crypto/password";

const stored = await hashPassword("my-secret");
const ok = await verifyPassword("my-secret", stored);
```

### Key derivation (HKDF)

```ts
import { deriveKey } from "@justwant/crypto/derive-key";

const key = deriveKey("master-secret", "salt", "encryption-key", 32);
```

### Encrypt / decrypt

**Single key (32 bytes):**

```ts
import { encrypt, decrypt } from "@justwant/crypto/encrypt";

const key = new Uint8Array(32); // from deriveKey or secure storage
const ciphertext = encrypt("sensitive data", key);
const plaintext = decrypt(ciphertext, key);
```

**Password-based:**

```ts
import { encryptWithPassword, decryptWithPassword } from "@justwant/crypto/encrypt";

const ciphertext = encryptWithPassword("secret", "user-password");
const plaintext = decryptWithPassword(ciphertext, "user-password");
```

### Rotating encryption (keyring)

```ts
import { createRotatingEncryption } from "@justwant/crypto/rotating-encryption";

const box = createRotatingEncryption([key1, key2]); // key1 = current
const ct = box.encrypt(new TextEncoder().encode("data"));
const pt = box.decrypt(ct);
box.rotate(); // new key prepended
```

### Hash (integrity, cache keys)

```ts
import { hashString } from "@justwant/crypto/hash";

const fingerprint = hashString("content"); // hex
```

### Tokens (magic links, OTP, API keys)

```ts
import {
  generateSecretCode,
  generateShortCode,
  hashForStorage,
  checkToken,
} from "@justwant/crypto/token";

const code = generateSecretCode(); // long hex
const short = generateShortCode(6); // e.g. "482917"
const stored = hashForStorage(code);
const valid = checkToken(code, stored);
```

### Safe comparison (constant-time)

```ts
import { secureCompare, secureCompareStrings } from "@justwant/crypto/compare";

secureCompare(new Uint8Array([1, 2]), new Uint8Array([1, 2]));
secureCompareStrings(apiKeyFromHeader, apiKeyFromDb);
```

### Signed payload (compact JWS)

```ts
import { signMessage, verifySignedMessage } from "@justwant/crypto/sign";

const token = await signMessage({ userId: "1" }, "secret");
const payload = await verifySignedMessage(token, "secret");
```

### JWT (sessions, APIs)

```ts
import { createJwt, verifyJwt, type CreateJwtOptions } from "@justwant/crypto/jwt";

const token = await createJwt({ sub: "user-1" }, "secret", { expIn: 3600 });
const payload = await verifyJwt(token, "secret");
```

### Primitives (low-level)

For advanced use: hashes, HMAC, HKDF, AES-GCM, ChaCha20-Poly1305, utils.

```ts
import { sha256, randomBytes, bytesToHex } from "@justwant/crypto/primitives";
```

## Exports overview

| Subpath                 | Purpose                          |
|-------------------------|-----------------------------------|
| `@justwant/crypto/password` | Passwords (Argon2id)             |
| `@justwant/crypto/derive-key` | Key derivation (HKDF)         |
| `@justwant/crypto/encrypt` | Encrypt/decrypt (key or password) |
| `@justwant/crypto/rotating-encryption` | Keyring (key rotation)   |
| `@justwant/crypto/hash` | Hash string (e.g. integrity)      |
| `@justwant/crypto/token` | Secret codes, OTP, storage hash   |
| `@justwant/crypto/compare` | Constant-time compare          |
| `@justwant/crypto/sign` | Signed payload (JWS)               |
| `@justwant/crypto/jwt`  | JWT create/verify                 |
| `@justwant/crypto/primitives` | Hashes, ciphers, utils      |

## Dependencies

- **argon2** — password hashing (Node only)
- **jose** — JWT and compact JWS
- **@noble/hashes** — SHA2, HMAC, HKDF, Argon2 (used only for primitives / KDF)
- **@noble/ciphers** — AES-GCM, ChaCha20-Poly1305

## License

MIT

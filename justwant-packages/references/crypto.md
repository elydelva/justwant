# @justwant/crypto

Subpath imports only. No default export.

## Subpaths

| Subpath | Usage |
|---------|-------|
| password | hashPassword, verifyPassword (Argon2id) |
| derive-key | deriveKey(secret, salt, info, length) |
| encrypt | encrypt, decrypt, encryptWithPassword, decryptWithPassword |
| rotating-encryption | createRotatingEncryption([key1, key2]) |
| hash | hashString(content) |
| token | generateSecretCode, generateShortCode, hashForStorage, checkToken |
| compare | secureCompare, secureCompareStrings |
| sign | signMessage, verifySignedMessage |
| jwt | createJwt, verifyJwt |
| primitives | sha256, randomBytes, bytesToHex |

```ts
import { hashPassword, verifyPassword } from "@justwant/crypto/password";
import { createJwt, verifyJwt } from "@justwant/crypto/jwt";
import { encrypt, decrypt } from "@justwant/crypto/encrypt";
```

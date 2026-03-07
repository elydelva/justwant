# @justwant/crypto

## 0.1.0

### Minor Changes

- Initial release. Password hashing (Argon2id), key derivation (HKDF), encrypt/decrypt (single key or password), rotating encryption (keyring), hash string, tokens (secret codes, OTP, storage hash, verify), constant-time compare, signed payload (JWS), JWT (create/verify). Subpath exports only; primitives under `@justwant/crypto/primitives`. Audited deps: argon2, jose, @noble/hashes, @noble/ciphers.

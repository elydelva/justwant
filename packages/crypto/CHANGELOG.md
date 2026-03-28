# @justwant/crypto

## [0.2.0](https://github.com/elydelva/justwant/compare/crypto-v0.1.0...crypto-v0.2.0) (2026-03-28)


### Features

* **cookie, event, crypto, id, adapter, cache, env:** create the fondation of the agnostic ecosystem ([2c0f900](https://github.com/elydelva/justwant/commit/2c0f9002c04f6c2cd16c93b5d52f45f1ef3f40e5))
* update README files across multiple packages to include license badges, installation instructions, and enhanced usage examples. Improve documentation clarity and structure for better user guidance. ([c2846a5](https://github.com/elydelva/justwant/commit/c2846a509d74a3a5fdd01470f2da32704e0cc050))

## 0.1.0

### Minor Changes

- Initial release. Password hashing (Argon2id), key derivation (HKDF), encrypt/decrypt (single key or password), rotating encryption (keyring), hash string, tokens (secret codes, OTP, storage hash, verify), constant-time compare, signed payload (JWS), JWT (create/verify). Subpath exports only; primitives under `@justwant/crypto/primitives`. Audited deps: argon2, jose, @noble/hashes, @noble/ciphers.

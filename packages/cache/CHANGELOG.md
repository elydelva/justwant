# @justwant/cache

## [0.2.1](https://github.com/elydelva/justwant/compare/cache-v0.2.0...cache-v0.2.1) (2026-03-28)


### Bug Fixes

* **sonar:** fix all 29 SonarQube CRITICAL issues ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))
* **storage:** update conditional checks in ensure-supabase.sh to use double brackets for improved syntax ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))

## [0.2.0](https://github.com/elydelva/justwant/compare/cache-v0.1.0...cache-v0.2.0) (2026-03-28)


### Features

* **cookie, event, crypto, id, adapter, cache, env:** create the fondation of the agnostic ecosystem ([2c0f900](https://github.com/elydelva/justwant/commit/2c0f9002c04f6c2cd16c93b5d52f45f1ef3f40e5))
* update README files across multiple packages to include license badges, installation instructions, and enhanced usage examples. Improve documentation clarity and structure for better user guidance. ([c2846a5](https://github.com/elydelva/justwant/commit/c2846a509d74a3a5fdd01470f2da32704e0cc050))

## 0.1.0

### Minor Changes

- Initial release. Unified key-value cache with interchangeable adapters (memory, storage, redis, upstash, cf-kv, vercel-kv, tiered). TTL, tag invalidation, namespacing. Plugins: namespace, serialize, encrypt, stats, stale, dedupe, prefetch, audit. Typed entries with valibot. Subpath exports for adapters, plugins, serializers.

### Patch Changes

- Updated dependencies
  - @justwant/crypto@0.1.0

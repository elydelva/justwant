# @justwant/cache

## 0.1.0

### Minor Changes

- Initial release. Unified key-value cache with interchangeable adapters (memory, storage, redis, upstash, cf-kv, vercel-kv, tiered). TTL, tag invalidation, namespacing. Plugins: namespace, serialize, encrypt, stats, stale, dedupe, prefetch, audit. Typed entries with valibot. Subpath exports for adapters, plugins, serializers.

### Patch Changes

- Updated dependencies
  - @justwant/crypto@0.1.0

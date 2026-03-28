# @justwant/embedding

## [0.3.1](https://github.com/elydelva/justwant/compare/embedding-v0.3.0...embedding-v0.3.1) (2026-03-28)


### Bug Fixes

* **sonar:** fix all 29 SonarQube CRITICAL issues ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))
* **storage:** update conditional checks in ensure-supabase.sh to use double brackets for improved syntax ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))

## [0.3.0](https://github.com/elydelva/justwant/compare/embedding-v0.2.0...embedding-v0.3.0) (2026-03-28)


### Features

* **embedding:** introduce @justwant/embedding package for embeddings and similarity search. Implement createEmbeddingService, defineUniverse, and defineEmbeddable. Support multiple storage backends and engines, with comprehensive documentation and testing setup. Update package metadata and changelog for version 0.2.0. ([363107b](https://github.com/elydelva/justwant/commit/363107b43172c76b694d548a1bea8559eb5b657f))

## 0.2.0

### Minor Changes

- Initial release. createEmbeddingService, defineUniverse, defineEmbeddable. Engines: cloudflare-ai, openai, memory (test). Storages: vectorize, pgvector, sqlite-vec, memory (test). Migration helpers for pgvector and sqlite-vec. Sandbox with Transformers.js for local dev.

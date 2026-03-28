# @justwant/storage

## [0.3.1](https://github.com/elydelva/justwant/compare/storage-v0.3.0...storage-v0.3.1) (2026-03-28)


### Bug Fixes

* **sonar:** fix all 29 SonarQube CRITICAL issues ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))
* **storage:** update conditional checks in ensure-supabase.sh to use double brackets for improved syntax ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))

## [0.3.0](https://github.com/elydelva/justwant/compare/storage-v0.2.1...storage-v0.3.0) (2026-03-28)


### Features

* **config:** enhance configuration management with multi-source support and validation ([98d70bd](https://github.com/elydelva/justwant/commit/98d70bd3a1345bae2e5c6de5ad73ccfd0ea0100d))
* **cron, refereal, waitlist, actor, bezier, flag, preference:** initiale realease ([9dcaacb](https://github.com/elydelva/justwant/commit/9dcaacb2636630250b9549154877a5fe4947c2e8))
* update README files across multiple packages to include license badges, installation instructions, and enhanced usage examples. Improve documentation clarity and structure for better user guidance. ([c2846a5](https://github.com/elydelva/justwant/commit/c2846a509d74a3a5fdd01470f2da32704e0cc050))

## 0.2.1

### Patch Changes

- Add README for @justwant/config and @justwant/storage

## 0.2.0

### Minor Changes

- **E2E Vercel Blob local** : support de vercel-blob-server (Docker) pour tests E2E sans token cloud
- **E2E Supabase local** : script `ensure-supabase.sh` + `supabase start` pour tests E2E autonomes
- Adapter vercel-blob : support de `VERCEL_BLOB_API_URL` pour endpoint personnalisé
- Adapter vercel-blob : fallback `head` + `fetch` pour versions sans `get()`
- E2E : création automatique du bucket Supabase avant les tests

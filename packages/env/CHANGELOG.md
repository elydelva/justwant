# @justwant/env

## [0.2.1](https://github.com/elydelva/justwant/compare/env-v0.2.0...env-v0.2.1) (2026-03-28)


### Bug Fixes

* **sonar:** fix all 29 SonarQube CRITICAL issues ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))
* **storage:** update conditional checks in ensure-supabase.sh to use double brackets for improved syntax ([b9bdda2](https://github.com/elydelva/justwant/commit/b9bdda24ffa168f62232d11939f19a5d32fb4971))

## [0.2.0](https://github.com/elydelva/justwant/compare/env-v0.1.0...env-v0.2.0) (2026-03-28)


### Features

* **cookie, event, crypto, id, adapter, cache, env:** create the fondation of the agnostic ecosystem ([2c0f900](https://github.com/elydelva/justwant/commit/2c0f9002c04f6c2cd16c93b5d52f45f1ef3f40e5))

## 0.1.0

### Minor Changes

- Initial release. Typed, validated environment variables with Standard Schema (Zod, Valibot, Arktype compatible). File loading (.env, .env.local), expansion (${VAR}), groups, clientPrefix (NEXT*PUBLIC*), defineEnv + include for Next.js client/server split. Node/Bun and Edge entry points (conditional exports: edge-light, workerd).

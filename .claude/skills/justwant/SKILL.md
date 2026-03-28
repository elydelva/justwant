---
name: justwant
description: >-
  Provides complete documentation for the @justwant TypeScript library ecosystem.
  Use when working with cache, storage, job, flag, permission, waitlist, referral,
  preference, notify, db, crypto, or any @justwant package. Contains usage, plugins,
  adapters, and API reference for each package.
---

# @justwant — Package Documentation

Complete reference for the @justwant monorepo. When working with a package, read the corresponding reference file in `references/`.

## When to Use This Skill

- User mentions @justwant, cache, storage, embedding, job, flag, permission, waitlist, referral
- Editing files in `packages/*`
- Implementing features using @justwant packages
- Configuring plugins or adapters

## Reference Files

- **Package references**: `references/<package>.md` — usage, API, adapters
- **Plugin docs**: `plugins/` — un fichier `.md` par plugin pour comprendre l’outil sans parcourir le code. Voir [plugins/README.md](plugins/README.md) pour l’index.

| Package | Reference | Key exports |
|---------|-----------|-------------|
| actor | [references/actor.md](references/actor.md) | defineActor, actorKey, toRepo |
| bezier | [references/bezier.md](references/bezier.md) | createBezierCurve, presets |
| cache | [references/cache.md](references/cache.md) | createCache, adapters, plugins |
| config | [references/config.md](references/config.md) | createConfigService |
| context | [references/context.md](references/context.md) | createContextService, defineSlot |
| contract | [references/contract.md](references/contract.md) | defineContract, fields |
| cookie | [references/cookie.md](references/cookie.md) | parseCookies, createCookieStore |
| crypto | [references/crypto.md](references/crypto.md) | password, jwt, encrypt |
| db | [references/db.md](references/db.md) | DAL, Drizzle, Prisma |
| env | [references/env.md](references/env.md) | createEnv |
| event | [references/event.md](references/event.md) | createEventBus |
| flag | [references/flag.md](references/flag.md) | defineFlag, defineRule |
| id | [references/id.md](references/id.md) | createId |
| job | [references/job.md](references/job.md) | createJob, engines, plugins |
| lock | [references/lock.md](references/lock.md) | createLock, createSemaphore |
| notify | [references/notify.md](references/notify.md) | createNotify, createTemplate, createCanal, channels, plugins |
| membership | [references/membership.md](references/membership.md) | createMembershipService |
| organisation | [references/organisation.md](references/organisation.md) | createOrganisationService |
| permission | [references/permission.md](references/permission.md) | createPermissionService |
| preference | [references/preference.md](references/preference.md) | createPreferenceService |
| referral | [references/referral.md](references/referral.md) | createReferralService |
| storage | [references/storage.md](references/storage.md) | createStorageService, plugins |
| embedding | [references/embedding.md](references/embedding.md) | createEmbeddingService, defineUniverse, engines, storages, migrate |
| user | [references/user.md](references/user.md) | createUserService |
| waitlist | [references/waitlist.md](references/waitlist.md) | createWaitlistService |
| warehouse | [references/warehouse.md](references/warehouse.md) | createWarehouse |

## Workflow

1. Identify the package(s) involved
2. Read the reference file(s) for usage, plugins, and API
3. Follow the patterns documented (adapters, options, subpaths)

## Package Conventions

- **Subpath imports**: `@justwant/package/subpath` (e.g. `@justwant/cache/adapters/redis`)
- **Adapters**: Most packages accept adapters for persistence (memory, db, redis)
- **Plugins**: Optional plugins extend behavior (audit, encryption, etc.)
- **Standard Schema**: Validation via zod, valibot, etc. when schema is required

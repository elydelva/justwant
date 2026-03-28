# Versioning, Releases & CI

## Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Every commit on `main` is parsed by Release Please to generate changelogs and bump versions.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

`scope` is the package name without the `@justwant/` prefix (e.g. `auth`, `cache`, `db`).

### Types and changelog visibility

| Type | Section | Visible |
|---|---|---|
| `feat` | Features | yes |
| `fix` | Bug Fixes | yes |
| `perf` | Performance Improvements | yes |
| `deps` | Dependencies | yes |
| `docs` | Documentation | yes |
| `revert` | Reverts | yes |
| `refactor` | Code Refactoring | no |
| `test` | Tests | no |
| `chore` | Miscellaneous | no |
| `ci` | CI/CD | no |

### Breaking changes

Add `!` after the type/scope, or include a `BREAKING CHANGE:` footer. Either triggers a major version bump.

```
feat(auth)!: remove legacy session API

BREAKING CHANGE: `createSession()` has been removed. Use `createToken()` instead.
```

## Release flow

Releases are fully automated via [Release Please](https://github.com/googleapis/release-please).

1. **Commits land on `main`** — Release Please opens or updates a release PR for each affected package.
2. **Release PR is merged** — Release Please tags the commit and creates a GitHub Release.
3. **Publish job runs** — the `release-please.yml` workflow builds and publishes the released packages to npm.

Each package under `packages/` is versioned independently. The manifest is tracked in `.release-please-manifest.json`.

### Config

- Workflow: `.github/workflows/release-please.yml`
- Config: `release-please-config.json`
- Manifest: `.release-please-manifest.json`

## CI

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Push / PR | Install, build, typecheck, lint, test |
| `release-please.yml` | Push to `main` | Open release PRs and publish to npm |
| `audit.yml` | Schedule / push | Security audit |

All CI checks must pass before a PR can be merged to `main`.

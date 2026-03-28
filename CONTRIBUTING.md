# Contributing

## Setup

```bash
bun install
bun run build
```

> Requires [Bun](https://bun.sh) ≥ 1.3. See [`docs/instructions/bun.md`](./docs/instructions/bun.md) for runtime conventions.

## Common commands

| Command | Description |
|---|---|
| `bun test` | Run all tests |
| `bun run typecheck` | TypeScript type check (no emit) |
| `bun run lint` | Lint with Biome |
| `bun run check` | Lint + format (auto-fix) |
| `bun run build` | Build all packages |

## Workflow

1. **Open an issue** — use the GitHub issue templates (bug or feature). Link to an ADR if applicable.
2. **Create a branch** from `main` — name it `feat/…`, `fix/…`, `chore/…`, `docs/…`.
3. **Open a Draft PR** as soon as the branch has a first meaningful commit. Link it to the issue with `Closes #N`.
4. **Write conventional commits** — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`. These feed the automated changelog. See [`docs/instructions/versioning.md`](./docs/instructions/versioning.md).
5. **Mark ready for review** when done. All CI checks must pass.

Full workflow details: [`docs/instructions/github-sync.md`](./docs/instructions/github-sync.md).

## PR templates

Use `gh pr create` with the appropriate template:

```bash
# Feature PR
gh pr create --draft \
  --title "[FEAT/Package] Short description" \
  --body-file .github/PULL_REQUEST_TEMPLATE/feature.md \
  --base main

# Bugfix PR
gh pr create --draft \
  --title "[FIX/Package] Short description" \
  --body-file .github/PULL_REQUEST_TEMPLATE/bugfix.md \
  --base main
```

See [`docs/instructions/templates.md`](./docs/instructions/templates.md) for the full template guide.

## Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Examples:

```
feat(auth): add OAuth 2.1 PKCE flow
fix(cache): handle Redis connection timeout
chore(ci): update release-please config
docs(adr): add ADR-007 for job queue design
```

Breaking changes: add `!` after the type (`feat(auth)!:`) or a `BREAKING CHANGE:` footer.

## Monorepo structure

```
packages/   — publishable @justwant/* packages
docs/       — ADRs, instructions, templates
```

Each package is independently versioned. Releases are automated via [Release Please](https://github.com/googleapis/release-please) on merge to `main`.

## Code quality

- **Formatter / linter**: [Biome](https://biomejs.dev/) — `bun run check` to auto-fix.
- **Pre-commit hook**: runs `biome check --write` on staged `*.ts` files (via Husky + lint-staged).
- **Type checking**: strict TypeScript — `bun run typecheck` before opening a PR.

# @justwant

TypeScript-first library ecosystem. Backend + database + storage bucket = complete platform. No vendor lock-in.

## Stack

- **Runtime**: Bun (not Node) — see `.claude/rules/bun.md`
- **Monorepo**: Turborepo + Bun workspaces
- **Linter/formatter**: Biome
- **Testing**: `bun test`
- **Releases**: Release Please (automated from conventional commits)

## Commands

```bash
bun install          # install dependencies
bun test             # run tests
bun run typecheck    # tsc --noEmit
bun run lint         # biome lint
bun run check        # biome check --write (lint + format)
bun run build        # build all packages
```

## Structure

```
packages/            — publishable @justwant/* packages (independently versioned)
docs/adr/            — architectural decision records
docs/instructions/   — human-readable contributor docs
.claude/rules/       — LLM instructions (loaded by Claude Code)
.claude/skills/      — Claude Code skills (/justwant, etc.)
```

## Rules

Detailed instructions live in `.claude/rules/`:

| Topic | File |
|-------|------|
| Runtime, APIs, testing | `.claude/rules/bun.md` |
| Conventional commits, versioning, CI | `.claude/rules/versioning.md` |
| ADR workflow | `.claude/rules/adr-workflow.md` |
| ADR template | `.claude/rules/adr-template.md` |
| GitHub sync (issues, PRs, draft PRs) | `.claude/rules/github-sync.md` |
| Issue & PR templates | `.claude/rules/templates.md` |

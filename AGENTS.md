# @justwant — Instructions pour l'IA

## Documentation des packages

Ce monorepo contient des packages `@justwant/*`. **Pour tout travail sur un package, lis son README** :

```
packages/<nom-du-package>/README.md
```

Chaque README documente : installation, usage, plugins, adapters, API.

## Entry point

- **Skill** : `justwant-packages/SKILL.md` — doc complète pour l'IA (references/*.md par package)
- **Règle Cursor** : `.cursor/rules/justwant-packages.mdc`
- **Vue d'ensemble** : `docs/00-overview.md`
- **Packages** : `packages/*/README.md`

## Conventions

- TypeScript strict
- Tests : `bun test`
- Lint/format : `bun run check`

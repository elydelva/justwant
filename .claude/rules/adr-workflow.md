# ADR Workflow

Each ADR in `docs/adr/` maps to a GitHub Issue and (eventually) a PR.
Apply these rules **every time** work touches an ADR.

## Frontmatter

```yaml
---
issue: ADR-000
title: …
branch: …
status: todo
pr: ~
pr_url: ~
github_issue: ~
github_issue_url: ~
depends_on: []
required_by: []
---
```

## Dependencies

`depends_on` / `required_by` form a DAG defining implementation order.
An ADR may only move to `in-progress` once all its `depends_on` are `completed`.
Keep `docs/adr/README.md` in sync (dependency table + implementation order).

## Lifecycle

| Status | When |
|--------|------|
| `todo` | ADR written, work not started |
| `in-progress` | Branch created / work begun |
| `completed` | PR merged to `main` |
| `abandoned` | Decision dropped — add `## Abandonment` section |

## Rules

1. **Starting** — set `in-progress`, open GitHub Issue if absent, fill `github_issue` + `github_issue_url`.
2. **Opening PR** — fill `pr` + `pr_url`, add `Closes #<github_issue>` in PR body.
3. **PR merged** — set `completed`.
4. **Dropped** — set `abandoned`, add `## Abandonment` with reason.
5. **Never leave** `pr`, `pr_url`, `github_issue`, `github_issue_url` blank — use `~`.
6. **Keep `docs/adr/README.md` in sync** — status column must match frontmatter.

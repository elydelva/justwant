# ADR Workflow

Each ADR in `docs/adr/` maps to a GitHub Issue and (eventually) a PR.
Apply these rules **every time** work touches an ADR.

## Frontmatter

Every ADR file must include this YAML frontmatter:

```yaml
---
issue: ADR-000          # ADR identifier
title: …
branch: …               # feature branch name
status: todo            # see lifecycle below
pr: ~                   # GitHub PR number, or ~ if not yet opened
pr_url: ~               # full URL to the PR, or ~
github_issue: ~         # GitHub Issue number, or ~
github_issue_url: ~     # full URL to the issue, or ~
depends_on: []          # ADRs that must be completed before this one starts
required_by: []         # ADRs that cannot start until this one is completed
---
```

## Dependencies

The `depends_on` / `required_by` fields form a directed acyclic graph that defines implementation order.

**Rule:** an ADR may only move to `in-progress` once all its `depends_on` entries are `completed`.

The full graph and recommended implementation order are maintained in [`docs/adr/README.md`](../adr/README.md).

When writing or modifying an ADR:
1. Set `depends_on` to every ADR whose completion is a prerequisite.
2. Add this ADR to `required_by` on each of those dependency ADRs (symmetric relation).
3. Update the dependency table and implementation order in `docs/adr/README.md`.

## Lifecycle

| Status | When to set it |
|--------|----------------|
| `todo` | ADR written, work not yet started |
| `in-progress` | Branch created / work begun |
| `completed` | PR merged to `main` |
| `abandoned` | Decision dropped — add an `## Abandonment` section explaining why |

## Rules

1. **Starting work** — set `status: in-progress`, create the GitHub Issue if absent, fill `github_issue` + `github_issue_url`.
2. **Opening a PR** — fill `pr` + `pr_url`, add `Closes #<github_issue>` in the PR body so GitHub auto-links it.
3. **PR merged** — set `status: completed`.
4. **Work dropped** — set `status: abandoned`, add an `## Abandonment` section with the reason.
5. **Keep `docs/adr/README.md` in sync** — the status column must always match the frontmatter.
6. Never leave `pr`, `pr_url`, `github_issue`, or `github_issue_url` blank — use `~` (YAML null) when unknown.

## ADR template

See [`adr-template.md`](./adr-template.md) for the canonical structure to use when creating a new ADR.

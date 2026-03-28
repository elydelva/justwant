# GitHub Sync

## Git is the source of truth

Commits, branches, tags, ADRs (`docs/adr/`), and commit messages are the durable record.
GitHub Issues and PRs are a UX layer — never rely on them for critical context.

## When to sync

| Moment | Action |
|--------|--------|
| Starting work on an ADR | Open the GitHub Issue if absent |
| First significant commit | Open a **Draft PR** with `Closes #N` |
| Ready for review | Mark Draft PR as **Ready for review** |
| PR merged | Issue closes automatically |
| Work dropped | Close issue; set `status: abandoned` in ADR |

## PR title format

`[TYPE/Feature Name]` — human-readable, not a commit message.

```
[FEAT/Auth]       Add OAuth 2.1 PKCE flow
[FIX/Cache]       Handle Redis connection timeout
[DOCS/ADR]        ADR workflow and templates
[CHORE/CI]        Switch to Release Please
```

Types: `FEAT`, `FIX`, `DOCS`, `CHORE`, `REFACTOR`, `PERF`, `TEST`

## Sync checklist

1. PR title uses `[TYPE/Name]` format.
2. PR body has `Closes #<N>`.
3. ADR frontmatter has `pr`, `pr_url`, `github_issue`, `github_issue_url` filled.
4. Use templates in `.github/PULL_REQUEST_TEMPLATE/`.
5. Durable decisions go in ADR or commit — not only in PR/issue body.

# GitHub Sync

## Git is the source of truth

In an AI-assisted workflow, **the git repository is the only reliable source of truth**:

- Commits, branches, and tags are immutable and auditable.
- ADRs (`docs/adr/`) record architectural decisions durably.
- Commit messages (Conventional Commits) form the living changelog.

GitHub Issues and PRs are a **UX layer** on top of git. They can be deleted, archived, or become stale. Never rely on them for critical context — that context belongs in commits or ADRs.

## Why sync at all

GitHub provides valuable collaboration tooling: code review, discussion threads, WIP signaling via Draft PRs, and visual traceability between issues and PRs. We use it, without depending on it.

## When to sync

| Moment | GitHub action |
|--------|---------------|
| Starting work on an ADR | Open the corresponding issue if it does not exist |
| First significant commit on the branch | Open a **Draft PR** linked to the issue (`Closes #N`) |
| Ready for review | Mark the Draft PR as **Ready for review** |
| PR merged | Issue closes automatically via `Closes #N` |
| Work dropped | Close the issue manually with a brief comment; set `status: abandoned` in the ADR |

## Draft PRs as WIP signals

Open a Draft PR **as soon as the branch has a first meaningful commit**, even if work is unfinished. It signals:
- to collaborators (human or AI) that this work is in progress,
- traceability between the branch and the issue is visible in the GitHub UI.

Draft PRs do not trigger review requests. Convert to a regular PR when the work is ready.

## PR title format

A PR title is **not** a commit message. It must be readable by a human scanning the PR list, not parsed by a changelog tool.

Format: `[TYPE/Feature Name]` followed by a short human-readable sentence.

```
[FEAT/Auth]       Add OAuth 2.1 PKCE flow
[FIX/IMAP]        Handle connection timeout on slow servers
[DOCS/ADR]        ADR workflow, templates, and AI instruction hub
[CHORE/CI]        Decouple SonarCloud scanning and GHCR publishing
```

Available types: `FEAT`, `FIX`, `DOCS`, `CHORE`, `REFACTOR`, `PERF`, `TEST`

> Conventional Commits belong in individual commit messages — they feed the automated changelog.
> PR titles serve human readability in the GitHub interface.

## Sync checklist

1. **Name the PR** using the `[TYPE/Name]` format above — never like a commit message.
2. **Always link** a PR to its issue with `Closes #<N>` in the PR body.
3. **Always fill** `pr`, `pr_url`, `github_issue`, `github_issue_url` in the corresponding ADR frontmatter (see [`adr-workflow.md`](./adr-workflow.md)).
4. **Use the templates** in `docs/templates/` when opening issues or PRs (see [`templates.md`](./templates.md)).
5. **Do not duplicate context** — a PR or issue body may summarize, but durable technical decisions live in the ADR or commit.
6. **Never block on GitHub** — if the interface is unavailable, work continues; sync can happen after the fact.

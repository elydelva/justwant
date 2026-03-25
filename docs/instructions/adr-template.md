# ADR Template

Copy this file to `docs/adr/ADR-XXX-slug.md` and fill in every section.
Remove sections that genuinely do not apply (e.g. `## Abandonment` while the ADR is active).

---

```markdown
---
issue: ADR-XXX
title: …
branch: feat/…
status: todo
pr: ~
pr_url: ~
github_issue: ~
github_issue_url: ~
depends_on: []          # ADRs that must be completed before this one starts
required_by: []         # ADRs that cannot start until this one is completed
---

# ADR-XXX — Title

## Context

Why does this decision need to be made?
What problem are we solving, and what constraints apply?

## Decisions

- Concrete technical choice #1
- Concrete technical choice #2

## Alternatives considered

| Option | Reason rejected |
|--------|----------------|
| …      | …              |

## Goals / Commits

- [ ] `feat(<scope>): …`
- [ ] `test(<scope>): …`

## Consequences

What does this decision make easier or harder going forward?
Any known trade-offs or follow-up work required?

## Abandonment

<!-- Only fill in if status = abandoned -->
Why was this ADR dropped and what replaces it, if anything?
```

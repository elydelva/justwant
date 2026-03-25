# Templates

Issue and PR templates live in `docs/templates/`.

```
docs/templates/
  issues/
    bug.md       ← unexpected behavior / regression
    feature.md   ← new work linked to an ADR or feature
  pr/
    bugfix.md    ← PR fixing a bug
    feature.md   ← PR implementing an ADR or feature
```

## Which template to use

| Situation | Template |
|-----------|---------|
| Unexpected behavior or regression | `issues/bug.md` |
| New work linked to an ADR or feature | `issues/feature.md` |
| PR fixing a bug | `pr/bugfix.md` |
| PR implementing an ADR or feature | `pr/feature.md` |

## Creating an issue from a template

```sh
gh issue create --title "ADR-00X — …" --body-file docs/templates/issues/feature.md
```

## Creating a PR from a template

PR titles follow the `[TYPE/Feature Name]` format — see [`github-sync.md`](./github-sync.md#pr-title-format).

```sh
# Open a Draft PR as soon as the branch has a first meaningful commit
gh pr create --draft \
  --title "[FEAT/Auth] Add OAuth 2.1 PKCE flow" \
  --body-file docs/templates/pr/feature.md \
  --base main

# Promote to ready when the work is complete
gh pr ready <number>
```

## General rule

Templates are starting points — adapt the content to the actual context. Remove any section that does not apply rather than leaving empty placeholders.

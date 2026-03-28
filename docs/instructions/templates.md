# Templates

GitHub issue templates live in `.github/ISSUE_TEMPLATE/` (auto-populated by GitHub's issue UI).
PR templates live in `.github/PULL_REQUEST_TEMPLATE/`.

```
.github/
  ISSUE_TEMPLATE/
    bug.yml      ← unexpected behavior / regression
    feature.yml  ← new work linked to an ADR or feature
    config.yml   ← issue chooser config
  PULL_REQUEST_TEMPLATE/
    bugfix.md    ← PR fixing a bug
    feature.md   ← PR implementing an ADR or feature

```

## Which template to use

| Situation | Template |
|-----------|---------|
| Unexpected behavior or regression | `.github/ISSUE_TEMPLATE/bug.yml` |
| New work linked to an ADR or feature | `.github/ISSUE_TEMPLATE/feature.yml` |
| PR fixing a bug | `.github/PULL_REQUEST_TEMPLATE/bugfix.md` |
| PR implementing an ADR or feature | `.github/PULL_REQUEST_TEMPLATE/feature.md` |

## Creating an issue from a template

Issue templates are automatically proposed by GitHub when opening a new issue. To create one from the CLI:

```sh
gh issue create --title "ADR-00X — …"
# GitHub will prompt for the template interactively
```

## Creating a PR from a template

PR titles follow the `[TYPE/Feature Name]` format — see [`github-sync.md`](./github-sync.md#pr-title-format).

```sh
# Open a Draft PR as soon as the branch has a first meaningful commit
gh pr create --draft \
  --title "[FEAT/Auth] Add OAuth 2.1 PKCE flow" \
  --body-file .github/PULL_REQUEST_TEMPLATE/feature.md \
  --base main

# Promote to ready when the work is complete
gh pr ready <number>
```

## General rule

Templates are starting points — adapt the content to the actual context. Remove any section that does not apply rather than leaving empty placeholders.

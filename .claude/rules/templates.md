# Templates

## Locations

```
.github/
  ISSUE_TEMPLATE/
    bug.yml       ← bug report (auto-proposed by GitHub)
    feature.yml   ← feature / ADR (auto-proposed by GitHub)
    config.yml    ← disables blank issues
  PULL_REQUEST_TEMPLATE/
    bugfix.md     ← PR fixing a bug
    feature.md    ← PR implementing an ADR or feature
```

## Which to use

| Situation | Template |
|-----------|---------|
| Unexpected behavior | `.github/ISSUE_TEMPLATE/bug.yml` |
| New work / ADR | `.github/ISSUE_TEMPLATE/feature.yml` |
| Bug fix PR | `.github/PULL_REQUEST_TEMPLATE/bugfix.md` |
| Feature PR | `.github/PULL_REQUEST_TEMPLATE/feature.md` |

## CLI

```sh
# Issues — GitHub proposes templates automatically; or:
gh issue create --title "ADR-00X — …"

# PRs
gh pr create --draft \
  --title "[FEAT/Package] Short description" \
  --body-file .github/PULL_REQUEST_TEMPLATE/feature.md \
  --base main

gh pr ready <number>  # promote from draft when done
```

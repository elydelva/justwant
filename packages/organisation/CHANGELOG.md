# @justwant/organisation

## [1.0.0](https://github.com/elydelva/justwant/compare/organisation-v0.2.0...organisation-v1.0.0) (2026-03-28)


### ⚠ BREAKING CHANGES

* **organisation:** multi-type support, standard helpers, organisations list

### Features

* **organisation:** multi-type support, standard helpers, organisations list ([f3ff5da](https://github.com/elydelva/justwant/commit/f3ff5da1c79c61bf456aabefd906da3f52a2df0c))
* update README files across multiple packages to include license badges, installation instructions, and enhanced usage examples. Improve documentation clarity and structure for better user guidance. ([c2846a5](https://github.com/elydelva/justwant/commit/c2846a509d74a3a5fdd01470f2da32704e0cc050))

## 0.2.0

### Breaking Changes

- **defineOrganisation** : signature `defineOrganisation()` → `defineOrganisation({ name, realm, group })`. Retourne `OrgDef<N>` avec realm et group.
- **createOrganisationService** : `overrides` supprimé. Nouveau paramètre requis `organisations: readonly OrgDef[]`. Les groups et realms sont dérivés des organisations.
- **Organisation** : champ `type: string` requis pour distinguer les types d'org (tenant, workspace, etc.).
- **create** : `data.type` requis.

### Minor Changes

- **createStandardOrganisationMembership** : génère member et group pour un type d'org (ex. `{ name: "tenant", member }`).
- **createStandardOrganisationPermission** : génère realm, permissions et roles pour un type d'org (ex. `{ name: "tenant", actor }`).
- Support multi-type : tenant, workspace, company, etc. avec realm et group nommés d'après le type.
- `./permissions` et `./membership` : alias vers les helpers standard avec `name: "organisation"` pour rétrocompatibilité.

## 0.1.0

### Minor Changes

- Initial release: organisation entity and facade via defineOrganisation and createOrganisationService. Integrates membership and permission via deps. API uses organisation and member params.

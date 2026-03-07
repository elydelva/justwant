# @justwant/organisation

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

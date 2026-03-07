# @justwant/permission

## 2.0.0

### Major Changes

- Refactor: modèle plat — suppression de within, singular et du système parent-enfant

  **Breaking changes:**

  - `createActor({ name })` : suppression de `within`. Signature `(id) => Actor`.
  - `createScope({ name })` : suppression de `singular` et `within`. 0 arg = scope singulier, 1 arg = scope pluriel.
  - `createResource({ name })` : suppression de `within`. Signature `(id) => Resource`.
  - `createRole` : suppression de `ceiling`.
  - Types : retrait de `orgId` sur Actor, Scope, Resource ; `actorOrgId`, `scopeOrgId`, `resourceOrgId` sur Assignment et Override.

  Migration : le scope identifie directement le contexte via son id. Pas de hiérarchie parent-enfant.

### Minor Changes

- API: paramètres objet avec noms explicites pour toutes les méthodes

  - `assign({ actor, role, scope })` au lieu de `assign(actor, role, scope)`
  - `can({ actor, action, scope, resource? })` au lieu de `can(actor, action, scope, resource?)`
  - `assert`, `hasRole`, `unassign`, `grant`, `deny`, `revokeGrant`, `revokeDeny`, `canAll`, `canAny`, `canMany`, `explain`, `revokeScope`, `revokeAll`, `realm` — idem
  - Export des types params : CanParams, AssertParams, AssignParams, HasRoleParams, etc.

## 1.0.0

### Major Changes

- Refactor: modèle plat — suppression de within, singular et du système parent-enfant

  **Breaking changes:**

  - `createActor({ name })` : suppression de `within`. Signature `(id) => Actor`.
  - `createScope({ name })` : suppression de `singular` et `within`. 0 arg = scope singulier, 1 arg = scope pluriel.
  - `createResource({ name })` : suppression de `within`. Signature `(id) => Resource`.
  - `createRole` : suppression de `ceiling`.
  - Types : retrait de `orgId` sur Actor, Scope, Resource ; `actorOrgId`, `scopeOrgId`, `resourceOrgId` sur Assignment et Override.

  Migration : le scope identifie directement le contexte via son id. Pas de hiérarchie parent-enfant.

## 0.2.0

### Minor Changes

- 9477986: Prepare @justwant/permission for publish: RBAC/ABAC with data-agnostic repos, explicit Actor/Scope/Resource, type-safe scopes.

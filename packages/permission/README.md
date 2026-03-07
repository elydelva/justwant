# @justwant/permission

RBAC/ABAC avec repos data-agnostic. Scopes, actors, roles, realms, grant/deny overrides.

## Installation

```bash
bun add @justwant/permission
```

## Usage

```ts
import {
  createScope,
  createActor,
  createAtomicPermission,
  createRole,
  createRealm,
  createPermission,
} from "@justwant/permission";

const appScope = createScope({ name: "app" });
const orgScope = createScope({ name: "org" });

const userActor = createActor({ name: "user" });
const documentRead = createAtomicPermission({ domain: "document", action: "read" });
const documentWrite = createAtomicPermission({ domain: "document", action: "write" });

const appMember = createRole({
  name: "member",
  permissions: [documentRead, documentWrite],
  realm: "app",
});
const orgAdmin = createRole({
  name: "admin",
  permissions: [documentRead, documentWrite],
  realm: "org",
});

const appRealm = createRealm({
  name: "app",
  scope: appScope,
  actors: [userActor],
  permissions: [documentRead, documentWrite],
  roles: [appMember],
});
const orgRealm = createRealm({
  name: "org",
  scope: orgScope,
  actors: [userActor],
  permissions: [documentRead, documentWrite],
  roles: [orgAdmin],
});

// Repos: AssignmentsRepo & OverridesRepo — in-memory, DB via @justwant/db, etc.
const perm = createPermission({
  repos: { assignments: myAssignmentsRepo, overrides: myOverridesRepo },
  realms: { app: appRealm, org: orgRealm },
});

const user = userActor("usr_1");
await perm.assign({ actor: user, role: appMember, scope: appScope() });
await perm.assign({ actor: user, role: orgAdmin, scope: orgScope("org_1") });

const canRead = await perm.can({ actor: user, action: documentRead, scope: orgScope("org_1") });
const hasRole = await perm.hasRole({ actor: user, role: orgAdmin, scope: orgScope("org_1") });
```

## API : paramètres objet

Toutes les méthodes utilisent des paramètres objet avec des noms explicites :

| Méthode | Params |
|---------|--------|
| `can` | `{ actor, action, scope, resource? }` |
| `assert` | `{ actor, action, scope, resource?, message? }` |
| `assign` | `{ actor, role, scope }` |
| `hasRole` | `{ actor, role, scope }` |
| `unassign` | `{ actor, scope }` |
| `grant` / `deny` / `revokeGrant` / `revokeDeny` | `{ actor, action, scope, resource? }` |
| `canAll` / `canAny` | `{ actor, actions, scope, resource? }` |
| `canMany` | `{ actors, action, scope, resource? }` |
| `explain` | `{ actor, action, scope, resource? }` |
| `revokeScope` | `{ scope }` |
| `revokeAll` | `{ actor }` |
| `realm` | `{ name }` |

## Scopes : singular vs plural

- **0 arg** = scope singulier (un seul scope global) : `appScope()` → `{ type: "app", id: null }`
- **1 arg** = scope pluriel (plusieurs instances) : `orgScope("org_1")` → `{ type: "org", id: "org_1" }`

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/permission` | API principale (createScope, createActor, createPermission, etc.) |
| `@justwant/permission/types` | Actor, Scope, Resource, PermissionRepository, Assignment, Override, CreateInput |
| `@justwant/permission/errors` | PermissionError, PermissionDeniedError, CeilingViolationError |

## Features

- **Data-agnostic** : fournissez vos propres repos (assignments, overrides)
- **Modèle plat** : Actor, Scope, Resource sans hiérarchie parent-enfant
- **Grant/deny overrides** : permissions au niveau scope ou resource
- **Shorthands** : `userId` au lieu de `{ type: "user", id }` quand un user actor existe

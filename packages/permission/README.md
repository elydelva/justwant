# @justwant/permission

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

RBAC/ABAC with data-agnostic repos. Scopes, actors, roles, realms, grant/deny overrides.

## Installation

```bash
bun add @justwant/permission
# or
npm install @justwant/permission
# or
pnpm add @justwant/permission
```

## Usage

```ts
import {
  defineScope,
  defineActor,
  defineAtomicPermission,
  defineRole,
  defineRealm,
  createPermissionService,
} from "@justwant/permission";

const appScope = defineScope({ name: "app" });
const orgScope = defineScope({ name: "org" });

const userActor = defineActor({ name: "user" });
// Or with @justwant/user: defineActor({ from: defineUser() })
const documentRead = defineAtomicPermission({ action: "document:read" });
const documentWrite = defineAtomicPermission({ action: "document:write" });

const appMember = defineRole({
  name: "member",
  permissions: [documentRead, documentWrite],
  realm: "app",
});
const orgAdmin = defineRole({
  name: "admin",
  permissions: [documentRead, documentWrite],
  realm: "org",
});

const appRealm = defineRealm({
  name: "app",
  scope: appScope,
  actors: [userActor],
  permissions: [documentRead, documentWrite],
  roles: [appMember],
});
const orgRealm = defineRealm({
  name: "org",
  scope: orgScope,
  actors: [userActor],
  permissions: [documentRead, documentWrite],
  roles: [orgAdmin],
});

// Repos: AssignmentsRepo & OverridesRepo — in-memory, DB via @justwant/db, etc.
// Lookup key is derived from realm.scope.name
const perm = createPermissionService({
  repos: { assignments: myAssignmentsRepo, overrides: myOverridesRepo },
  realms: [appRealm, orgRealm],
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
| `@justwant/permission` | API principale (defineScope, defineActor, createPermissionService, etc.) |
| `@justwant/permission/types` | Actor, Scope, Resource, IdentityLike, ReferenceLike, ScopeLike, Assignment, Override, CreateInput |
| `@justwant/permission/errors` | PermissionError, PermissionDeniedError, CeilingViolationError |

## Features

- **Data-agnostic** — provide your own repos (assignments, overrides)
- **Flat model** — Actor, Scope, Resource without parent-child hierarchy
- **Grant/deny overrides** — permissions at scope or resource level
- **Shorthands** — `userId` instead of `{ type: "user", id }` when a user actor exists

## License

MIT

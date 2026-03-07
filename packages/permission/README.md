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
const appScope = createScope({ name: "app", singular: true });
const orgScope = createScope({ name: "org", singular: false });

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
  ceiling: appMember,
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
await perm.assign(user, appMember, appScope());
await perm.assign(user, orgAdmin, orgScope("org_1"));

const canRead = await perm.can(user, documentRead, orgScope("org_1"));
const hasRole = await perm.hasRole(user, orgAdmin, orgScope("org_1"));
```

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/permission` | API principale (createScope, createActor, createPermission, etc.) |
| `@justwant/permission/types` | Actor, Scope, Resource, PermissionRepository, Assignment, Override, CreateInput |
| `@justwant/permission/errors` | PermissionError, PermissionDeniedError, CeilingViolationError |

## Features

- **Data-agnostic** : fournissez vos propres repos (assignments, overrides)
- **Multi-actor** : user, org, group avec `within`
- **Ceiling** : un rôle peut exiger un rôle parent dans un realm supérieur
- **Grant/deny overrides** : permissions au niveau scope ou resource
- **Shorthands** : `userId` au lieu de `{ type: "user", id }` quand un user actor existe

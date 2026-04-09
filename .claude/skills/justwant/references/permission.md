# @justwant/permission

RBAC/ABAC. `defineScope`, `defineActor`, `defineAtomicPermission`, `defineRole`, `defineRealm`, `createPermissionService`.

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

const appScope = defineScope({ name: "app" });   // ScopeDef — extends Inspectable<"app">
const orgScope = defineScope({ name: "org" });
const userActor = defineActor({ name: "user" }); // ActorDef — extends Definable<"user">

// name: is the identifier (extends Inspectable<N>)
const documentRead = defineAtomicPermission({ name: "document:read" });
const documentWrite = defineAtomicPermission({ name: "document:write" });

const appMember = defineRole({
  name: "member",
  permissions: [documentRead],
  realm: "app",
}); // RoleDef<"member"> — extends Inspectable<"member">

const appRealm = defineRealm({
  name: "app",
  scope: appScope,
  actors: [userActor],
  permissions: [documentRead, documentWrite],
  roles: [appMember],
}); // RealmDef<"app"> — extends Inspectable<"app">

const perm = createPermissionService({
  repos: { assignments: myAssignmentsRepo, overrides: myOverridesRepo },
  realms: [appRealm],
});

await perm.assign({ actor: userActor("usr_1"), role: appMember, scope: appScope() });
await perm.unassign({ actor: userActor("usr_1"), role: appMember, scope: appScope() });

const canRead = await perm.can({ actor: userActor("usr_1"), action: documentRead, scope: orgScope("org_1") });
await perm.assert({ actor: userActor("usr_1"), action: documentRead, scope: orgScope("org_1") });

await perm.grant({ actor: userActor("usr_1"), action: documentWrite, scope: orgScope("org_1") });
await perm.deny({ actor: userActor("usr_1"), action: documentWrite, scope: orgScope("org_1") });
```

## Scopes

```ts
appScope()         // { type: "app", id: null }  — singular (global)
orgScope("org_1")  // { type: "org", id: "org_1" } — plural (instance)
```

`ScopeDef<N>` extends `Inspectable<N>`.

## Types summary

| Type | Extends | Key field |
|------|---------|-----------|
| `ScopeDef<N>` | `Inspectable<N>` | `name: N` |
| `AtomicPermission<N>` | `Inspectable<N>` | `name: N` (the action string) |
| `RoleDef<N>` | `Inspectable<N>` | `name: N` |
| `RealmDef<N>` | `Inspectable<N>` | `name: N`, `permissionByName`, `roleByName` |

## API

`assign`, `unassign`, `can`, `assert`, `grant`, `deny`, `revokeGrant`, `revokeDeny`

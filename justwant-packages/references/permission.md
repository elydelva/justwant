# @justwant/permission

RBAC/ABAC. defineScope, defineActor, defineAtomicPermission, defineRole, defineRealm, createPermissionService.

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
const documentRead = defineAtomicPermission({ action: "document:read" });

const appMember = defineRole({ name: "member", permissions: [documentRead], realm: "app" });
const appRealm = defineRealm({ name: "app", scope: appScope, actors: [userActor], permissions: [documentRead], roles: [appMember] });

const perm = createPermissionService({
  repos: { assignments: myAssignmentsRepo, overrides: myOverridesRepo },
  realms: [appRealm],
});

await perm.assign({ actor: userActor("usr_1"), role: appMember, scope: appScope() });
const canRead = await perm.can({ actor: user, action: documentRead, scope: orgScope("org_1") });
```

## Scopes

appScope() → singular. orgScope("org_1") → plural.

# @justwant/permission

Type-safe RBAC/ABAC engine. Scopes, actors, roles, realms, grant/deny overrides.

## Install

```bash
bun add @justwant/permission
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

// 1. Model
const orgScope    = defineScope({ name: "organization" });
const userActor   = defineActor({ name: "user" });

const readDoc      = defineAtomicPermission({ name: "document:read" });
const writeDoc     = defineAtomicPermission({ name: "document:write" });
const manageBilling = defineAtomicPermission({ name: "billing:manage" });

const viewerRole = defineRole({ name: "viewer", permissions: [readDoc] });
const editorRole = defineRole({ name: "editor", permissions: [readDoc, writeDoc] });
const adminRole  = defineRole({ name: "admin",  permissions: [readDoc, writeDoc, manageBilling] });

const orgRealm = defineRealm({
  name: "organization",
  scope: orgScope,
  actors: [userActor],
  permissions: [readDoc, writeDoc, manageBilling],
  roles: [viewerRole, editorRole, adminRole],
});

// 2. Service
const permission = createPermissionService({
  repos: { assignments: assignmentsRepo, overrides: overridesRepo },
  realms: [orgRealm],
});

// 3. Assign / check
const actor = { type: "user", id: "user_123" };
const scope = orgScope("org_abc");

await permission.assign({ actor, role: editorRole, scope });
await permission.can({ actor, action: readDoc, scope });    // true
await permission.can({ actor, action: manageBilling, scope }); // false
await permission.assert({ actor, action: readDoc, scope }); // throws PermissionDeniedError if false
await permission.hasRole({ actor, role: editorRole, scope }); // true

// 4. Overrides (bypass roles)
await permission.grant({ actor, action: manageBilling, scope });
await permission.deny({ actor, action: writeDoc, scope });
await permission.revokeGrant({ actor, action: manageBilling, scope });
await permission.revokeDeny({ actor, action: writeDoc, scope });

// 5. Explain
const result = await permission.explain({ actor, action: readDoc, scope });
// { result: true, reason: "role", role: "editor" }
// reason: "grant" | "deny" | "role" | undefined
```

## Resolution order

| Priority | Source | Wins over |
|----------|--------|-----------|
| 1 (highest) | Deny override | Everything |
| 2 | Grant override | Role assignments |
| 3 | Role assignment | Default |
| 4 (lowest) | Default | — returns `false` |

## defineScope

`defineScope({ name })` → `ScopeDef<N>` — callable factory:

```ts
orgScope()        // { type: "organization", id: null }   — singleton
orgScope("org_1") // { type: "organization", id: "org_1" } — instance
```

## defineActor

| Form | Options | Example result |
|------|---------|---------------|
| Basic | `{ name }` | `userActor("u1")` → `{ type: "user", id: "u1" }` |
| Within | `{ name, within }` | `memberActor("org_1", "u1")` → `{ type: "member", id: "u1", within: { type: "...", id: "org_1" } }` |
| From | `{ from: IdentityLike }` | Derives from existing identity def |

## defineAtomicPermission options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | Yes | Permission string, e.g. `"document:read"` |
| `resource` | `ReferenceLike` | No | Optional resource type |

## defineRole options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | Yes | Role name |
| `permissions` | `AtomicPermission[]` | Yes | Granted permissions |
| `except` | `AtomicPermission[]` | No | Subtract from set — resolved to `RoleDef.resolved: Set<string>` |
| `realm` | `string` | No | Realm name (informational) |

## defineRealm options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | Yes | Realm identifier (conventionally = scope name) |
| `scope` | `ScopeDef` | Yes | Scope this realm governs |
| `actors` | `IdentityLike[]` | Yes | Actor types |
| `resources` | `ReferenceLike[]` | No | Resource types (default: `[]`) |
| `permissions` | `AtomicPermission[]` | Yes | All permissions |
| `roles` | `RoleDef[]` | Yes | All roles |

Pre-builds `realm.roleByName` and `realm.permissionByName` maps.

## createPermissionService options

| Option | Type | Description |
|--------|------|-------------|
| `repos.assignments` | `AssignmentsRepo` | Role assignment repository |
| `repos.overrides` | `OverridesRepo` | Grant/deny override repository |
| `realms` | `RealmDef[]` | Registered realms (unique scope names) |

## PermissionApi methods

| Method | Description |
|--------|-------------|
| `can({ actor, action, scope, resource? })` | `Promise<boolean>` |
| `assert({ actor, action, scope, resource? })` | Throws `PermissionDeniedError` if denied |
| `assign({ actor, role, scope })` | Assign a role |
| `unassign({ actor, role, scope })` | Remove all assignments for actor in scope |
| `hasRole({ actor, role, scope })` | `Promise<boolean>` — check role membership |
| `grant({ actor, action, scope })` | Grant override |
| `deny({ actor, action, scope })` | Deny override |
| `revokeGrant({ actor, action, scope })` | Remove grant override |
| `revokeDeny({ actor, action, scope })` | Remove deny override |
| `canAll({ actor, actions, scope })` | True if actor has all listed actions |
| `canAny({ actor, actions, scope })` | True if actor has any listed action |
| `canMany({ actors, action, scope })` | `Promise<Map<string, boolean>>` |
| `explain({ actor, action, scope })` | `Promise<{ result, reason?, role? }>` |
| `revokeScope({ scope })` | Remove all assignments + overrides for scope |
| `revokeAll({ actor })` | Remove all assignments + overrides for actor |
| `realm({ name })` | Retrieve `RealmDef` by scope name |

## Repositories

### AssignmentsRepo — `Assignment` entity

| Field | Type |
|-------|------|
| `id` | `string` |
| `actorType` | `string` |
| `actorId` | `string` |
| `role` | `string` |
| `scopeType` | `string` |
| `scopeId` | `string \| null` |
| `createdAt` | `Date` |
| `updatedAt` | `Date` |

### OverridesRepo — `Override` entity

| Field | Type |
|-------|------|
| `id` | `string` |
| `type` | `"grant" \| "deny"` |
| `actorType` | `string` |
| `actorId` | `string` |
| `permission` | `string` |
| `scopeType` | `string` |
| `scopeId` | `string \| null` |
| `resourceType` | `string` |
| `resourceId` | `string` |
| `grantedBy` / `deniedBy` | `string` |

Both repos extend `PermissionRepository<T>`: `findById`, `findOne`, `findMany`, `create`, `update`, `delete`.

## Errors

| Class | Thrown by | Key properties |
|-------|-----------|----------------|
| `PermissionError` | Base class | — |
| `PermissionDeniedError` | `assert()` | `actorId?`, `permission?`, `scopeId?` |
| `CeilingViolationError` | `assign()` / overrides | `requiredRole?`, `actorRole?` |

```ts
import { PermissionDeniedError, CeilingViolationError } from "@justwant/permission";
```

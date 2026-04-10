# @justwant/organisation

Façade that wires `@justwant/membership` + `@justwant/permission` into a single `OrganisationApi`. Handles organisation CRUD, member management, role assignment, and permission-gated operations.

## Install

```bash
bun add @justwant/organisation @justwant/membership @justwant/permission
```

## Usage

```ts
import {
  createStandardOrganisationMembership,
  createStandardOrganisationPermission,
  defineOrganisation,
  createOrganisationService,
} from "@justwant/organisation";
import { createMembershipService } from "@justwant/membership";
import { createPermissionService } from "@justwant/permission";
import { User } from "./user.ts"; // MemberDef from @justwant/user

// Step 1 — membership layer
const { group: teamGroup } = createStandardOrganisationMembership({ name: "team", member: User });
const membership = createMembershipService({ repo: membershipsRepo, groups: [teamGroup] });

// Step 2 — permission layer
const { realm: teamRealm, roles, permissions } = createStandardOrganisationPermission({ name: "team", actor: User });
const permission = createPermissionService({ repo: permissionsRepo, realms: [teamRealm] });

// Step 3 — bind into an org definition
const Team = defineOrganisation({ name: "team", realm: teamRealm, group: teamGroup });

// Step 4 — create the façade
const orgs = createOrganisationService({
  repo: organisationsRepo,
  deps: { membership, permission },
  organisations: [Team],
});

// Use
const team = await orgs.create({ type: "team", name: "Acme", slug: "acme" });
await orgs.addMember({ organisation: team, member: { id: user.id }, role: "owner" });
await orgs.assignRole({ organisation: team, member: { id: user.id }, role: "admin" });
const allowed = await orgs.can({ organisation: team, member: { id: user.id }, permission: permissions.settingsEdit });
await orgs.removeMember({ organisation: team, member: { id: user.id } });
const myTeams = await orgs.listForMember({ member: { id: user.id } });
```

## createStandardOrganisationMembership

```ts
function createStandardOrganisationMembership<N extends string>(
  options: { name: N; member: MemberLike }
): { member: MemberLike; group: GroupDef<N> }
```

Calls `defineGroup` internally. Pass `group` to both `createMembershipService` and `defineOrganisation`.

## createStandardOrganisationPermission

```ts
function createStandardOrganisationPermission<N extends string>(
  options: { name: N; actor: IdentityLike }
): { realm: RealmDef; permissions: Record<string, AtomicPermission>; roles: Record<string, RoleDef> }
```

Generates 10 atomic permissions (prefixed with org type name) and 4 built-in roles.

### Permissions

| Key | Name | Description |
|-----|------|-------------|
| `organisationRead` | `{name}:read` | Read org details |
| `organisationUpdate` | `{name}:update` | Update org settings |
| `organisationDelete` | `{name}:delete` | Delete the org |
| `organisationTransfer` | `{name}:transfer` | Transfer ownership (reserved — no API method yet) |
| `memberList` | `member:list` | List members |
| `memberInvite` | `member:invite` | Invite new members |
| `memberRemove` | `member:remove` | Remove members |
| `memberUpdateRole` | `member:updateRole` | Change a member's role |
| `settingsView` | `settings:view` | View settings |
| `settingsEdit` | `settings:edit` | Edit settings |

### Roles

| Role | Permissions granted |
|------|---------------------|
| `owner` | All 10 permissions |
| `admin` | read, update, member:*, settings:* |
| `member` | read, member:list |
| `viewer` | read |

## defineOrganisation

```ts
function defineOrganisation<N extends string>(options: DefineOrganisationOptions<N>): OrgDef<N>
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `N extends string` | Unique type discriminator |
| `realm` | `RealmDef` | From `createStandardOrganisationPermission` |
| `group` | `GroupDef<N>` | From `createStandardOrganisationMembership` |

`OrgDef<N>` is callable: `Team("id") → { type: "team", id: "id" }`.

## createOrganisationService options

| Option | Type | Description |
|--------|------|-------------|
| `repo` | `OrganisationsRepo` | Storage implementation |
| `deps.membership` | `MembershipApi` | From `createMembershipService` |
| `deps.permission` | `PermissionApi` | From `createPermissionService` |
| `organisations` | `readonly OrgDef[]` | All registered org definitions |

## OrganisationApi

| Method | Signature | Notes |
|--------|-----------|-------|
| `create` | `(data: CreateInput<Organisation> & { type: string }) → Promise<Organisation>` | Throws `DuplicateSlugError` on slug conflict |
| `findById` | `(id) → Promise<Organisation \| null>` | — |
| `findBySlug` | `(slug) → Promise<Organisation \| null>` | — |
| `findOne` | `(where) → Promise<Organisation \| null>` | — |
| `findMany` | `(where) → Promise<Organisation[]>` | — |
| `update` | `({ id, data, member? }) → Promise<Organisation>` | `member` triggers `{type}:update` permission check. Throws `OrganisationNotFoundError`, `DuplicateSlugError`, `PermissionDeniedError` |
| `delete` | `({ id, member? }) → Promise<void>` | `member` triggers `{type}:delete` permission check |
| `addMember` | `({ organisation, member, role }) → Promise<void>` | Adds to group AND assigns role simultaneously |
| `removeMember` | `({ organisation, member }) → Promise<void>` | Unassigns all roles then removes from group |
| `listMembers` | `({ organisation }) → Promise<{ type: string; id: string }[]>` | — |
| `listForMember` | `({ member }) → Promise<Organisation[]>` | Across all registered org types |
| `can` | `({ organisation, member, permission }) → Promise<boolean>` | — |
| `assignRole` | `({ organisation, member, role }) → Promise<void>` | — |

## OrganisationsRepo interface

```ts
interface OrganisationsRepo {
  findById(id: string): Promise<Organisation | null>;
  findOne(where: Partial<Organisation>): Promise<Organisation | null>;
  findMany(where: Partial<Organisation>): Promise<Organisation[]>;
  create(data: CreateInput<Organisation>): Promise<Organisation>;
  update(id: string, data: Partial<Organisation>): Promise<Organisation>;
  delete(id: string): Promise<void>;
}
```

`Organisation`: `{ id, type, name, slug?, createdAt?, updatedAt? }`

## Errors

| Class | Thrown by | Key properties |
|-------|-----------|----------------|
| `OrganisationError` | Base class | — |
| `OrganisationNotFoundError` | `update`, `delete` | — |
| `DuplicateSlugError` | `create`, `update` | `slug` |

Note: `@justwant/permission` can additionally throw `PermissionDeniedError` when `update` or `delete` is called with a `member` lacking the required permission.

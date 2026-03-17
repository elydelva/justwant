# @justwant/organisation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Organisation entity and facade with multi-type support. Integrates membership and permission via deps.

## Installation

```bash
bun add @justwant/organisation @justwant/membership @justwant/permission
# or
npm install @justwant/organisation @justwant/membership @justwant/permission
# or
pnpm add @justwant/organisation @justwant/membership @justwant/permission
```

## Features

- **defineOrganisation** — defines an organisation type with name, realm, and group
- **createStandardOrganisationMembership** — generates member and group for an org type (tenant, workspace, etc.)
- **createStandardOrganisationPermission** — generates realm, permissions, and roles for an org type
- **createOrganisationService** — CRUD + membership + permission orchestration
- **OrganisationPermissions, OrganisationRealm, OrganisationGroup** — defaults for `name: "organisation"`
- **API params** — `organisation` and `member` (not org/actor)

## Usage

### Standard setup (organisation type)

```ts
import {
  createOrganisationService,
  defineOrganisation,
  createStandardOrganisationMembership,
  createStandardOrganisationPermission,
} from "@justwant/organisation";
import { OrganisationGroup } from "@justwant/organisation/membership";
import { OrganisationPermissions, OrganisationRealm } from "@justwant/organisation/permissions";
import { createMembershipService, defineMember } from "@justwant/membership";
import { createPermissionService, defineActor } from "@justwant/permission";

const member = defineMember({ name: "user" });
const actor = defineActor({ name: "user" });
const { group } = createStandardOrganisationMembership({ name: "organisation", member });
const { realm } = createStandardOrganisationPermission({ name: "organisation", actor });
const OrganisationOrg = defineOrganisation({ name: "organisation", realm, group });

const membership = createMembershipService({
  repo: membershipsRepo,
  groups: [OrganisationGroup],
});

const permission = createPermissionService({
  repos: { assignments: assignmentsRepo, overrides: overridesRepo },
  realms: [OrganisationRealm],
});

const org = createOrganisationService({
  repo: organisationsRepo,
  deps: { membership, permission },
  organisations: [OrganisationOrg],
});

const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
await org.addMember({
  organisation: acme,
  member: { id: alice.id },
  role: "owner",
});

const canDelete = await org.can({
  organisation: acme,
  member: alice,
  permission: OrganisationPermissions.organisationDelete,
});
```

### Multi-type (tenant + workspace)

```ts
const member = defineMember({ name: "user" });
const actor = defineActor({ name: "user" });

const { group: tenantGroup } = createStandardOrganisationMembership({ name: "tenant", member });
const { realm: tenantRealm } = createStandardOrganisationPermission({ name: "tenant", actor });
const TenantOrg = defineOrganisation({ name: "tenant", realm: tenantRealm, group: tenantGroup });

const { group: workspaceGroup } = createStandardOrganisationMembership({ name: "workspace", member });
const { realm: workspaceRealm } = createStandardOrganisationPermission({ name: "workspace", actor });
const WorkspaceOrg = defineOrganisation({ name: "workspace", realm: workspaceRealm, group: workspaceGroup });

const org = createOrganisationService({
  repo,
  deps: { membership, permission },
  organisations: [TenantOrg, WorkspaceOrg],
});

await org.create({ name: "Acme", slug: "acme", type: "tenant" });
await org.create({ name: "Dev Team", slug: "dev", type: "workspace" });
```

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/organisation` | Main API |
| `@justwant/organisation/permissions` | OrganisationPermissions, OrganisationRoles, OrganisationRealm |
| `@justwant/organisation/membership` | OrganisationMember, OrganisationGroup |
| `@justwant/organisation/types` | Organisation, OrgRef, OrganisationsRepo |
| `@justwant/organisation/errors` | OrganisationError, OrganisationNotFoundError, DuplicateSlugError |

## API

| Method | Description |
|--------|-------------|
| `create(organisation)` | Create organisation |
| `addMember(organisation, member, role)` | Add member with role |
| `removeMember(organisation, member)` | Remove member |
| `can(organisation, member, permission)` | Check permission |
| `findById(id)` | Get organisation by id |

## License

MIT

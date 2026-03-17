# @justwant/membership

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Member–group liaison via `defineMember`, `defineGroup`, and `createMembershipService`. No roles, no within. The member type is declared in the group.

## Installation

```bash
bun add @justwant/membership
# or
npm install @justwant/membership
# or
pnpm add @justwant/membership
```

## Features

- **defineMember** — defines a member type (e.g. `user`, `bot`)
- **defineGroup** — defines a group type and the member type it accepts
- **createMembershipService** — links members to groups with add/remove/has/listMembers/listGroups
- **Type safety** — a member can only be added to a group that accepts its type
- **Repo aligned** — `MembershipsRepo` follows @justwant/db pattern (findById, findOne, findMany, create, update, delete)

## Installation

```bash
bun add @justwant/membership
```

## Usage

```ts
import { defineMember, defineGroup, createMembershipService } from "@justwant/membership";

const userMember = defineMember({ name: "user" });
const orgGroup = defineGroup({ name: "org", member: userMember });
const groupGroup = defineGroup({ name: "group", member: userMember });

const membership = createMembershipService({
  repo: myMembershipsRepo, // implementation via @justwant/db
  groups: [orgGroup, groupGroup],
});

await membership.add(userMember("usr_1"), orgGroup("org_1"));
const isMember = await membership.has(userMember("usr_1"), orgGroup("org_1"));
const orgMembers = await membership.listMembers(orgGroup("org_1"));
const userOrgs = await membership.listGroups(userMember("usr_1"));
```

## API

### defineMember

```ts
const userMember = defineMember({ name: "user" });
const member = userMember("usr_1"); // { type: "user", id: "usr_1" }
```

### defineGroup

```ts
const orgGroup = defineGroup({ name: "org", member: userMember });
const group = orgGroup("org_1"); // { type: "org", id: "org_1" }
```

The `member` option indicates which member type the group accepts.

### createMembershipService

- `add(member, group)` — add member to group (throws if already member or type invalid)
- `remove(member, group)` — remove member from group (throws if not member)
- `has(member, group)` — check if member is in group
- `listMembers(group)` — list all members of a group
- `listGroups(member)` — list all groups a member belongs to

## Subpath exports

```ts
import { defineMember, defineGroup, createMembershipService } from "@justwant/membership";
import type { Member, Group, Membership, MembershipsRepo } from "@justwant/membership/types";
import {
  MembershipError,
  AlreadyMemberError,
  NotMemberError,
  InvalidMemberTypeError,
} from "@justwant/membership/errors";
```

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/membership` | defineMember, defineGroup, createMembershipService |
| `@justwant/membership/types` | Member, Group, Membership, MembershipsRepo |
| `@justwant/membership/errors` | MembershipError, AlreadyMemberError, NotMemberError, InvalidMemberTypeError |

## License

MIT

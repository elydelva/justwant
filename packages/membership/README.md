# @justwant/membership

Member–group liaison via `createMember`, `createGroup`, and `createMembership`. No roles, no within. The member type is declared in the group.

## Features

- **createMember** — defines a member type (e.g. `user`, `bot`)
- **createGroup** — defines a group type and the member type it accepts
- **createMembership** — links members to groups with add/remove/has/listMembers/listGroups
- **Type safety** — a member can only be added to a group that accepts its type
- **Repo aligned** — `MembershipsRepo` follows @justwant/db pattern (findById, findOne, findMany, create, update, delete)

## Installation

```bash
bun add @justwant/membership
```

## Usage

```ts
import { createMember, createGroup, createMembership } from "@justwant/membership";

const userMember = createMember({ name: "user" });
const orgGroup = createGroup({ name: "org", member: userMember });
const groupGroup = createGroup({ name: "group", member: userMember });

const membership = createMembership({
  repo: myMembershipsRepo, // implementation via @justwant/db
  members: [userMember],
  groups: [orgGroup, groupGroup],
});

await membership.add(userMember("usr_1"), orgGroup("org_1"));
const isMember = await membership.has(userMember("usr_1"), orgGroup("org_1"));
const orgMembers = await membership.listMembers(orgGroup("org_1"));
const userOrgs = await membership.listGroups(userMember("usr_1"));
```

## API

### createMember

```ts
const userMember = createMember({ name: "user" });
const member = userMember("usr_1"); // { type: "user", id: "usr_1" }
```

### createGroup

```ts
const orgGroup = createGroup({ name: "org", member: userMember });
const group = orgGroup("org_1"); // { type: "org", id: "org_1" }
```

The `member` option indicates which member type the group accepts.

### createMembership

- `add(member, group)` — add member to group (throws if already member or type invalid)
- `remove(member, group)` — remove member from group (throws if not member)
- `has(member, group)` — check if member is in group
- `listMembers(group)` — list all members of a group
- `listGroups(member)` — list all groups a member belongs to

## Subpath exports

```ts
import { createMember, createGroup, createMembership } from "@justwant/membership";
import type { Member, Group, Membership, MembershipsRepo } from "@justwant/membership/types";
import {
  MembershipError,
  AlreadyMemberError,
  NotMemberError,
  InvalidMemberTypeError,
} from "@justwant/membership/errors";
```

## License

MIT

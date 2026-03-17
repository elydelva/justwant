# @justwant/membership

Member–group liaison. defineMember, defineGroup, createMembershipService.

## Usage

```ts
import { defineMember, defineGroup, createMembershipService } from "@justwant/membership";

const userMember = defineMember({ name: "user" });
const orgGroup = defineGroup({ name: "org", member: userMember });

const membership = createMembershipService({ repo: myMembershipsRepo, groups: [orgGroup] });

await membership.add(userMember("usr_1"), orgGroup("org_1"));
const isMember = await membership.has(userMember("usr_1"), orgGroup("org_1"));
const members = await membership.listMembers(orgGroup("org_1"));
const groups = await membership.listGroups(userMember("usr_1"));
```

## API

add, remove, has, listMembers, listGroups

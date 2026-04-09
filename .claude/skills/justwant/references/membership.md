# @justwant/membership

Member–group many-to-many liaison. Type-safe membership without roles (roles live in `@justwant/permission`).

## Install

```bash
bun add @justwant/membership
```

## Usage

```ts
import { defineMember, defineGroup, createMembershipService } from "@justwant/membership";

const User = defineMember({ name: "user" });
// User("u-1") → { type: "user", id: "u-1" }

const Team = defineGroup({ name: "team", member: User });
// Team("t-1") → { type: "team", id: "t-1" }

const membership = createMembershipService({
  repo: myMembershipsRepo,
  groups: [Team],
});

await membership.add(User("u-1"), Team("t-1"));
// throws AlreadyMemberError if already linked
// throws InvalidMemberTypeError if User is not accepted by Team

const isMember = await membership.has(User("u-1"), Team("t-1")); // true
const members  = await membership.listMembers(Team("t-1"));       // Member[]
const groups   = await membership.listGroups(User("u-1"));        // Group[]

await membership.remove(User("u-1"), Team("t-1"));
// throws NotMemberError if not linked
```

## defineMember

```ts
function defineMember<N extends string>(options: DefineMemberOptions<N>): MemberDef<N>
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `N extends string` | Discriminator string for this member type |

`MemberDef<N>` is callable: `User("id") → { type: "user", id: "id" }`. Has read-only `name` property. Satisfies `MemberLike`. Safe to call at module load time — creates no runtime state.

## defineGroup

```ts
function defineGroup<N extends string>(options: DefineGroupOptions<N>): GroupDef<N>
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `N extends string` | Discriminator string for this group type |
| `member` | `MemberLike` | The member definition this group accepts |

`GroupDef<N>` is callable: `Team("id") → { type: "team", id: "id" }`. Has read-only `name` and `member` properties.

Multiple group types can share the same `member` type — the service registers the member type once and routes by group name.

## createMembershipService options

| Option | Type | Description |
|--------|------|-------------|
| `repo` | `MembershipsRepo` | Storage implementation |
| `groups` | `readonly GroupLike[]` | All registered group definitions (members derived from each group's `.member`) |

## API

| Method | Signature | Notes |
|--------|-----------|-------|
| `add` | `(member, group) → Promise<void>` | Throws `AlreadyMemberError` or `InvalidMemberTypeError` |
| `remove` | `(member, group) → Promise<void>` | Throws `NotMemberError` |
| `has` | `(member, group) → Promise<boolean>` | — |
| `listMembers` | `(group) → Promise<Member[]>` | All members of the group |
| `listGroups` | `(member) → Promise<Group[]>` | All groups the member belongs to |

## MembershipsRepo interface

```ts
interface MembershipsRepo {
  findById(id: string): Promise<Membership | null>;
  findOne(where: Partial<Membership>): Promise<Membership | null>;
  findMany(where: Partial<Membership>): Promise<Membership[]>;
  create(data: CreateInput<Membership>): Promise<Membership>;
  update(id: string, data: Partial<Membership>): Promise<Membership>;
  delete(id: string): Promise<void>;
}
```

`Membership`: `{ id, memberType, memberId, groupType, groupId, createdAt?, updatedAt? }`

## Errors

| Class | Thrown by | Key properties |
|-------|-----------|----------------|
| `MembershipError` | Base class | — |
| `AlreadyMemberError` | `add` | `memberType`, `memberId`, `groupType`, `groupId` |
| `NotMemberError` | `remove` | `memberType`, `memberId`, `groupType`, `groupId` |
| `InvalidMemberTypeError` | `add` (wrong type or unregistered) | `memberType`, `groupType`, `expectedMemberType` |

## Relationship with @justwant/organisation

`@justwant/organisation` wraps this package via `createStandardOrganisationMembership`. If you use that package, you typically do not call `createMembershipService` directly — but you must still provide a `MembershipsRepo`.

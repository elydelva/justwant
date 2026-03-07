# @justwant/membership

## 0.3.0

### Breaking Changes

- `createMembershipService`: `members` retiré. Les membres sont dérivés des groupes via `group.member`.

  **Migration :** `{ repo, members: [userMember], groups: [orgGroup] }` → `{ repo, groups: [orgGroup] }`

## 0.2.0

### Breaking Changes

- `createMember` renamed to `defineMember`
- `createGroup` renamed to `defineGroup`
- `createMembership` renamed to `createMembershipService`
- Added `MemberLike` and `GroupLike` structural interfaces for cross-package composition

## 0.1.0

### Minor Changes

- Initial release: member–group liaison via createMember, createGroup, createMembership. No roles, no within. Member type declared in group.

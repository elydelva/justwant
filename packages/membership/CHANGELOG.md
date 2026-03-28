# @justwant/membership

## [1.0.0](https://github.com/elydelva/justwant/compare/membership-v0.3.0...membership-v1.0.0) (2026-03-28)


### ⚠ BREAKING CHANGES

* **organisation:** multi-type support, standard helpers, organisations list

### Features

* **membership:** initial release of member–group liaison functionality ([b2344f0](https://github.com/elydelva/justwant/commit/b2344f01170e12e8179e8c2ce0d2abf61174d539))
* **organisation:** multi-type support, standard helpers, organisations list ([f3ff5da](https://github.com/elydelva/justwant/commit/f3ff5da1c79c61bf456aabefd906da3f52a2df0c))
* update README files across multiple packages to include license badges, installation instructions, and enhanced usage examples. Improve documentation clarity and structure for better user guidance. ([c2846a5](https://github.com/elydelva/justwant/commit/c2846a509d74a3a5fdd01470f2da32704e0cc050))

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

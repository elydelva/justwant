# @justwant/user

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

User entity and identity via `defineUser` and `createUserService`.

## Installation

```bash
bun add @justwant/user
# or
npm install @justwant/user
# or
pnpm add @justwant/user
```

## Features

- **defineUser** — defines the User identity type (no params, canonical "user")
- **createUserService** — CRUD operations via UsersRepo (findById, findByEmail, create, update, delete)
- **Type safety** — UserRef compatible with permission (defineActor from) and membership (MemberLike)
- **Repo aligned** — UsersRepo follows @justwant/db pattern (findById, findOne, findMany, create, update, delete)

## Usage

```ts
import { defineUser, createUserService } from "@justwant/user";

const userDef = defineUser();
const userRef = userDef("usr_1"); // { type: "user", id: "usr_1" }

const userService = createUserService({
  repo: myUsersRepo, // implementation via @justwant/db
});

await userService.findById("usr_1");
await userService.findByEmail("alice@example.com");
await userService.create({ email: "alice@example.com", name: "Alice" });
await userService.update("usr_1", { name: "Alicia" });
await userService.delete("usr_1");
```

## Integration

- **permission** : `defineActor({ from: defineUser() })` → ActorDef for defineRealm
- **membership** : `createMembershipService({ groups: [defineGroup({ name: "org", member: defineUser() })] })`
- **context** : `defineSlot({ key: "user", resolve: async (ctx) => userService.findById(ctx.initial.userId) })`

## API

| Method | Description |
|--------|-------------|
| `findById(id)` | Get user by id |
| `findByEmail(email)` | Get user by email |
| `create(data)` | Create user |
| `update(id, data)` | Update user |
| `delete(id)` | Delete user |

## Subpaths

| Path | Description |
|------|-------------|
| `@justwant/user` | defineUser, createUserService |
| `@justwant/user/types` | User, UserRef, UsersRepo, CreateInput |
| `@justwant/user/errors` | UserError, UserNotFoundError, DuplicateEmailError |

## License

MIT

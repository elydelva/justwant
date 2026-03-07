# @justwant/user

User entity and identity via `defineUser` and `createUserService`.

## Features

- **defineUser** — defines the User identity type (no params, canonical "user")
- **createUserService** — CRUD operations via UsersRepo (findById, findByEmail, create, update, delete)
- **Type safety** — UserRef compatible with permission (defineActor from) and membership (MemberLike)
- **Repo aligned** — UsersRepo follows @justwant/db pattern (findById, findOne, findMany, create, update, delete)

## Installation

```bash
bun add @justwant/user
```

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

## Subpath exports

```ts
import { defineUser, createUserService } from "@justwant/user";
import type { User, UserRef, UsersRepo, CreateInput } from "@justwant/user/types";
import { UserError, UserNotFoundError, DuplicateEmailError } from "@justwant/user/errors";
```

## License

MIT

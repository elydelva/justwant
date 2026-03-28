# @justwant/user

User entity. defineUser, createUserService. UsersRepo pattern.

## Usage

```ts
import { defineUser, createUserService } from "@justwant/user";

const userDef = defineUser();
const userRef = userDef("usr_1"); // { type: "user", id: "usr_1" }

const userService = createUserService({ repo: myUsersRepo });

await userService.findById("usr_1");
await userService.findByEmail("alice@example.com");
await userService.create({ email: "alice@example.com", name: "Alice" });
await userService.update("usr_1", { name: "Alicia" });
await userService.delete("usr_1");
```

## Integration

defineActor({ from: defineUser() }) for permission. defineGroup({ member: defineUser() }) for membership.

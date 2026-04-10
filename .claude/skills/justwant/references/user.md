# @justwant/user

User identity layer. `defineUser` → `UserRef` factory. `createUserService` → CRUD API over `UsersRepo`.

## Install

```bash
bun add @justwant/user
```

## Usage

```ts
import { defineUser, createUserService } from "@justwant/user";

// Call once at module level
export const User = defineUser();
// User("usr_1") → { type: "user", id: "usr_1" }

const users = createUserService({ repo: myUsersRepo });

const user  = await users.create({ email: "alice@example.com", name: "Alice" });
const found = await users.findById(user.id);
const byEmail = await users.findByEmail("alice@example.com");
const one   = await users.findOne({ name: "Alice" });
const many  = await users.findMany({ name: "Alice" });  // {} = list all
const updated = await users.update(user.id, { name: "Ada" });
await users.delete(user.id);

// Produce a UserRef for membership/permission
const ref = User(user.id); // { type: "user", id: "..." }
```

## defineUser

```ts
function defineUser(): UserDef
```

No options. Returns `UserDef` — a callable `(id: string) => UserRef` with `.name === "user"`. Safe to call at module load time (no side effects).

## createUserService options

| Option | Type       | Description |
|--------|------------|-------------|
| `repo` | `UsersRepo` | Storage implementation |

## UsersApi methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `findById` | `(id: string) => Promise<User \| null>` | Find by primary key |
| `findByEmail` | `(email: string) => Promise<User \| null>` | Find by email |
| `findOne` | `(where: Partial<User>) => Promise<User \| null>` | First matching user |
| `findMany` | `(where: Partial<User>) => Promise<User[]>` | All matching users |
| `create` | `(data: CreateInput<User>) => Promise<User>` | Persist new user; throws `DuplicateEmailError` on duplicate |
| `update` | `(id: string, data: Partial<User>) => Promise<User>` | Patch; throws `UserNotFoundError` or `DuplicateEmailError` |
| `delete` | `(id: string) => Promise<void>` | Remove; throws `UserNotFoundError` |

`CreateInput<User>` = `{ email: string; name?: string }` (omits `id`, `createdAt`, `updatedAt`).

## UsersRepo interface

```ts
interface UsersRepo {
  findById(id: string): Promise<User | null>;
  findOne(where: Partial<User>): Promise<User | null>;
  findMany(where: Partial<User>): Promise<User[]>;
  create(data: CreateInput<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
```

## User shape

```ts
interface User {
  id: string;
  email: string;
  name?: string;
}
```

## Errors

| Class | Thrown by | Key property |
|-------|-----------|--------------|
| `UserError` | Base class | — |
| `UserNotFoundError` | `update`, `delete` | `userId?: string`, `email?: string` |
| `DuplicateEmailError` | `create`, `update` | `email: string` |

```ts
import { UserNotFoundError, DuplicateEmailError } from "@justwant/user";
```

## Integration

- `User` factory (`UserDef`) used as `actor` / `member` in `@justwant/permission` and `@justwant/membership`
- Pass `User` (the `defineUser()` result) to `defineActor({ from: User })` or `createStandardOrganisationMembership({ member: User })`

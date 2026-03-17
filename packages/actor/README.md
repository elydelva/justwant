# @justwant/actor

Canonical Actor type and utilities. No storage, agnostic. defineActor, actorKey, toRepo, parseActorKey.

## Installation

```bash
bun add @justwant/actor
```

## Usage

```ts
import {
  defineActor,
  actorKey,
  toRepo,
  parseActorKey,
  type Actor,
} from "@justwant/actor";

// Simple actor
const userActor = defineActor({ name: "user" });
const actor = userActor("usr_1");
// → { type: "user", id: "usr_1" }

// Actor with within (scoped context)
const userInOrg = defineActor({ name: "user", within: "org" });
const scopedActor = userInOrg("org_1", "usr_1");
// → { type: "user", id: "usr_1", within: { type: "org", id: "org_1" } }

// Composition with defineUser (from @justwant/user)
// defineActor({ from: defineUser() })

// Serialization
actorKey(actor); // → "user:usr_1"
actorKey(scopedActor); // → "user:usr_1:org:org_1"

// Repo shape for packages that persist (waitlist, lock, preference)
toRepo(scopedActor);
// → { actorType, actorId, actorWithinType, actorWithinId, actorOrgId? }

// Parse back
parseActorKey("user:usr_1:org:org_1");
// → { type: "user", id: "usr_1", within: { type: "org", id: "org_1" } }
```

## API

| Export | Description |
|--------|-------------|
| `defineActor` | Define actor type. Options: `{ name }`, `{ name, within }`, `{ from: IdentityLike }` |
| `actorKey` | Serialize actor to string. Format: `type:id` or `type:id:withinType:withinId` |
| `toRepo` | Flatten to repo shape (actorType, actorId, actorWithinType?, actorWithinId?, actorOrgId?) |
| `parseActorKey` | Parse actorKey back to Actor |
| `Actor` | Canonical identity type |
| `ActorWithin` | Optional locality (type, id) |
| `IdentityLike` | Structural interface for composition |
| `RepoShape` | Shape returned by toRepo |

## Agnostic within

The `within` field is agnostic of domain. Use any type that fits your context:

- `within: { type: "org", id: "org_1" }` — user in organisation
- `within: { type: "team", id: "team_1" }` — user in team
- `within: { type: "workspace", id: "ws_1" }` — user in workspace

When `within.type === "org"`, `toRepo` also sets `actorOrgId` for legacy compat with waitlist/lock.

## Exports

| Path | Contents |
|------|----------|
| `@justwant/actor` | defineActor, actorKey, toRepo, parseActorKey, types |
| `@justwant/actor/types` | Actor, ActorWithin, IdentityLike |

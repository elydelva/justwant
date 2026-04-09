# @justwant/actor

Typed identity primitive. Define named actor types, create instances, serialize for storage/logs/keys, persist to DB.

## Install

```bash
bun add @justwant/actor
```

## Usage

```ts
import { defineActor, actorKey, toRepo, fromRepo, parseActorKey } from "@justwant/actor";

// Simple actor
const userActor = defineActor({ name: "user" });
const user = userActor("user_123");
// { type: "user", id: "user_123" }

// Scoped actor (within)
const memberActor = defineActor({ name: "member", within: "org" });
const member = memberActor("org_789", "mbr_456");
// { type: "member", id: "mbr_456", within: { type: "org", id: "org_789" } }

// Composition (from) — delegates to an existing identity
const adminActor = defineActor({ from: userActor });
adminActor("user_123"); // { type: "user", id: "user_123" }

// Serialization
actorKey(user);    // "user:user_123"
actorKey(member);  // "member:mbr_456:org:org_789"

// DB persistence
toRepo(member);
// { actorType: "member", actorId: "mbr_456", actorWithinType: "org", actorWithinId: "org_789", actorOrgId: "org_789" }

// Reconstruct from DB row
fromRepo({ actorType: "member", actorId: "mbr_456", actorWithinType: "org", actorWithinId: "org_789" });
// Legacy fallback: fromRepo({ actorType: "member", actorId: "mbr_456", actorOrgId: "org_789" })

// Parse key string
parseActorKey("user:user_123");              // { type: "user", id: "user_123" }
parseActorKey("member:mbr_456:org:org_789"); // { type: "member", id: "mbr_456", within: { type: "org", id: "org_789" } }
parseActorKey("member:mbr_456:org_789");     // legacy 3-part → within: { type: "org", id: "org_789" }
```

## defineActor options

| Shape | Option | Type | Description |
|-------|--------|------|-------------|
| `{ name }` | `name` | `string` | Simple actor — factory signature `(id)` |
| `{ name, within }` | `name`, `within` | `string` | Scoped actor — factory signature `(withinId, id)` |
| `{ from }` | `from` | `IdentityLike` | Delegates to an existing identity definition |

## Core functions

| Function | Returns | Description |
|----------|---------|-------------|
| `defineActor(options)` | `ActorDef<N>` | Define a typed actor factory |
| `actorKey(actor)` | `string` | Serialize to `"type:id"` or `"type:id:withinType:withinId"` |
| `toRepo(actor)` | `RepoShape` | Flatten to DB row; sets `actorOrgId` when `withinType === "org"` |
| `fromRepo(shape)` | `Actor` | Reconstruct from DB row; prefers `actorWithinType/Id`, falls back to `actorOrgId` |
| `parseActorKey(key)` | `Actor` | Parse 2-part, 3-part (legacy), or 4-part key string |

## Types

### `Actor<T>`
| Field | Type | Description |
|-------|------|-------------|
| `type` | `T` | Actor type name |
| `id` | `string` | Actor instance id |
| `within` | `ActorWithin \| undefined` | Container reference if scoped |

### `RepoShape`
| Field | Type | Description |
|-------|------|-------------|
| `actorType` | `string` | Actor type name |
| `actorId` | `string` | Actor instance id |
| `actorWithinType` | `string \| undefined` | Container type |
| `actorWithinId` | `string \| undefined` | Container id |
| `actorOrgId` | `string \| undefined` | Set when `actorWithinType === "org"` (legacy compat) |

## Integration

Used by: waitlist, lock, preference. `defineActor({ from: defineUser() })` for user actors.

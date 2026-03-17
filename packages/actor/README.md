# @justwant/actor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Canonical Actor type and utilities for identity across packages. No storage, domain-agnostic. Use `defineActor`, `actorKey`, `toRepo`, and `parseActorKey` to represent and serialize actors (users, bots, systems) with optional scoped context (`within`).

## Installation

```bash
bun add @justwant/actor
# or
npm install @justwant/actor
# or
pnpm add @justwant/actor
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

## Subpaths

| Path | Contents |
|------|----------|
| `@justwant/actor` | defineActor, actorKey, toRepo, parseActorKey, types |
| `@justwant/actor/types` | Actor, ActorWithin, IdentityLike, RepoShape |

## Integration

- **@justwant/user** — `defineActor({ from: defineUser() })` for user actors
- **@justwant/waitlist** — uses Actor for subscribe/invite
- **@justwant/preference** — uses Actor for preference isolation
- **@justwant/lock** — uses Actor for lock ownership

## License

MIT

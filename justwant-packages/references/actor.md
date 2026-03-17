# @justwant/actor

Canonical Actor type. No storage. defineActor, actorKey, toRepo, parseActorKey.

## Usage

```ts
import { defineActor, actorKey, toRepo, parseActorKey } from "@justwant/actor";

const userActor = defineActor({ name: "user" });
const actor = userActor("usr_1"); // { type: "user", id: "usr_1" }

const userInOrg = defineActor({ name: "user", within: "org" });
const scoped = userInOrg("org_1", "usr_1"); // { type, id, within: { type: "org", id: "org_1" } }

actorKey(actor); // "user:usr_1"
actorKey(scoped); // "user:usr_1:org:org_1"

toRepo(scoped); // { actorType, actorId, actorWithinType, actorWithinId, actorOrgId? }
parseActorKey("user:usr_1:org:org_1"); // Actor
```

## defineActor options

| Option | Description |
|--------|-------------|
| name | Actor type |
| within | Scoped context (org, team, workspace) |
| from | IdentityLike (e.g. defineUser()) |

## Integration

waitlist, preference, lock use Actor. defineActor({ from: defineUser() }) for user actors.

# @justwant/meta

Shared type foundation. Zero dependencies, no runtime exports. Three structural interfaces used by all `define*` factories in the ecosystem.

## Install

```bash
bun add @justwant/meta
# or: import type only — no runtime needed
```

## Interfaces

```ts
import type { Inspectable, Definable, RefLike } from "@justwant/meta";

// Named descriptor — has a stable literal name
// Used by: RoleDef, RealmDef, AtomicPermission, RuleDef, FlagDef, LockableDef, ScopeDef
interface Inspectable<N extends string = string> {
  readonly name: N;
}

// Callable factory — produces typed {type, id} references
// Used by: ActorDef, ResourceDef, FeatureDef, MemberDef, GroupDef, WaitlistDef,
//          ReferralOfferDef, PreferenceDef, JobDefinition, LockOwnerDef
interface Definable<K extends string = string> extends Inspectable<K> {
  (id: string): { type: K; id: string };
}

// Universal entity reference — produced by all Definable factories
interface RefLike<T extends string = string> {
  type: T;
  id: string;
}
```

## Hierarchy

```
Inspectable<N>       — config descriptors with a literal name
    └── Definable<N> — callable factories that produce {type, id} references
```

## Rule of thumb

- `Definable<N>` — the object **creates instances** (`userActor("u1")`, `org("o1")`).
- `Inspectable<N>` — the object **is** the final descriptor (a role, a rule, a permission).

## Structural typing

No explicit implementation needed — any object matching the shape satisfies the interface. Consumer packages do not need a hard dependency on `@justwant/meta`.

```ts
// Accept any Definable in a generic function:
function resolveRef<N extends string>(def: Definable<N>, id: string): RefLike<N> {
  return def(id);
}

// Every define* factory satisfies Definable<N> structurally:
const user = defineActor({ name: "user" });
user.name    // "user" — literal type (Inspectable)
user("u1")   // { type: "user", id: "u1" } — RefLike<"user">

// Config objects satisfy Inspectable<N>:
const admin = defineRole({ name: "admin", permissions: [...] });
admin.name   // "admin" — literal type
```

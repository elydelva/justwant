# @justwant/meta

Foundation interfaces. Zero dependencies. Structural contracts for all `define*` functions in the ecosystem.

## Interfaces

```ts
import type { Inspectable, Definable, RefLike } from "@justwant/meta";

// Named config descriptor — has a stable literal name
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

## Usage

```ts
// Every define* factory satisfies Definable<N> structurally:
const user = defineActor({ name: "user" });
user.name        // "user" — literal type
user("u1")       // { type: "user", id: "u1" } — RefLike<"user">

// Config objects satisfy Inspectable<N>:
const admin = defineRole({ name: "admin", permissions: [...] });
admin.name       // "admin" — literal type

// Accept any Definable in a generic function:
function resolveRef<N extends string>(def: Definable<N>, id: string): RefLike<N> {
  return def(id);
}
```

## Rule of thumb

- `Definable<N>` — the object creates **instances** (`user("u1")`, `org("o1")`).
- `Inspectable<N>` — the object **is** the final descriptor (a role, a rule, a permission).

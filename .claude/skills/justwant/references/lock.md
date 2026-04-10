# @justwant/lock

Distributed mutex and counting semaphore with pluggable `LockRepository`, declarative definitions, TTL expiry, and lifecycle hooks.

## Install

```bash
bun add @justwant/lock
```

## Usage

```ts
import { defineLockable, defineLockOwner, createLock, createSemaphore, auditLockHooks } from "@justwant/lock";

// Define resources
const order = defineLockable({ name: "order", singular: false, prefix: "app" });
const maintenance = defineLockable({ name: "maintenance", singular: true });

// Define owners
const user = defineLockOwner({ name: "user", within: "org" });
const system = defineLockOwner({ name: "system" });

// Mutex
const lock = createLock({ repo: myLockRepo, hooks: auditLockHooks({ onAcquire, onRelease }) });
const owner = user("org_1", "user_42");  // { type: "user", id: "user_42", within: { type: "org", id: "org_1" } }
const lockable = order("ord_123");       // { type: "order", key: "app:order:ord_123" }

const acquired = await lock.acquire(owner, lockable, { ttlMs: 60_000 });
if (acquired) {
  try { /* critical section */ } finally { await lock.release(owner, lockable); }
}

// Extend TTL while working
await lock.extend(owner, lockable, 60_000);
const locked = await lock.isLocked(lockable);
await lock.forceRelease(lockable); // admin override, ignores owner

// Semaphore
const sem = createSemaphore({ repo: myLockRepo, max: 10 });
const ok = await sem.acquire(owner, lockable, 3);  // acquire 3 units
if (ok) { try { /* use units */ } finally { await sem.release(owner, lockable, 3); } }
const free = await sem.available(lockable);         // max - currentHeld
```

## defineLockable

```ts
function defineLockable<N extends string>(options: DefineLockableOptions<N>): LockableDef<N>
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `N` | Yes | Literal type name |
| `singular` | `boolean` | Yes | `true` = one global key, `false` = key per params |
| `prefix` | `string` | No | Prepended to the generated key |

```ts
// Singular — no params; calling with params throws LockableParamsError
const billing = defineLockable({ name: "billing", singular: true });
billing()                           // { type: "billing", key: "billing" }

// Plural — string param
const user = defineLockable({ name: "user", singular: false });
user("user-42")                     // { type: "user", key: "user:user-42" }

// Plural — record param (keys sorted alphabetically for determinism)
const item = defineLockable({ name: "item", singular: false });
item({ tenantId: "t1", itemId: "i99" }) // key: "item:itemId:i99:tenantId:t1"

// With prefix
const order = defineLockable({ name: "order", singular: false, prefix: "shop" });
order("order-7")                    // key: "shop:order:order-7"
```

`LockableDef<N>` has read-only properties: `name`, `singular`, `prefix`. Returns `Lockable<N>`: `{ type: N; key: string }`.

## defineLockOwner

```ts
function defineLockOwner<N extends string>(options: DefineLockOwnerOptions<N>): LockOwnerDef<N>
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `N` | Yes | Literal owner type name |
| `within` | `string` | No | Parent scope type |

```ts
const Worker = defineLockOwner({ name: "worker" });
Worker("w-1")                       // { type: "worker", id: "w-1" }

const OrgUser = defineLockOwner({ name: "user", within: "org" });
OrgUser("org-abc", "user-42")       // { type: "user", id: "user-42", within: { type: "org", id: "org-abc" } }
```

`LockOwner` is an alias for `Actor` from `@justwant/actor`.

## createLock options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `repo` | `LockRepository` | Yes | Storage backend |
| `hooks` | `LockHooks` | No | Lifecycle hooks |

## createSemaphore options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `repo` | `LockRepository` | Yes | Storage backend |
| `max` | `number` | Yes | Maximum total units held concurrently |
| `hooks` | `LockHooks` | No | Lifecycle hooks |

## API

| Method | Signature | Notes |
|--------|-----------|-------|
| `lock.acquire` | `(owner, lockable, opts?) → Promise<boolean>` | `opts.ttlMs?` — TTL in ms. Re-entrant for same owner. Returns `false` if held by another. |
| `lock.release` | `(owner, lockable) → Promise<void>` | Throws `LockNotHeldError` if not held by owner. |
| `lock.extend` | `(owner, lockable, ttlMs) → Promise<boolean>` | Throws `LockNotHeldError` if not held. |
| `lock.isLocked` | `(lockable) → Promise<boolean>` | `true` if held and not expired. |
| `lock.forceRelease` | `(lockable) → Promise<void>` | Removes all lock records, ignores owner. |
| `sem.acquire` | `(owner, lockable, count?) → Promise<boolean>` | `count` defaults to 1. Returns `false` if insufficient capacity. |
| `sem.release` | `(owner, lockable, count?) → Promise<void>` | `count` defaults to 1. Throws `LockNotHeldError` if owner holds fewer units. |
| `sem.available` | `(lockable) → Promise<number>` | `max - currentHeld` (expired records excluded from count). |

## LockRepository interface

```ts
interface LockRepository {
  findOne(where: Partial<Lock>): Promise<Lock | null>;
  findMany(where: Partial<Lock>): Promise<Lock[]>;
  create(data: CreateInput<Lock>): Promise<Lock>;
  update(id: string, data: Partial<Lock>): Promise<Lock>;
  delete(id: string): Promise<void>;
}
```

`Lock`: `{ id, lockableKey, ownerType, ownerId, ownerOrgId?, count, expiresAt?, createdAt?, updatedAt? }`

## Hooks

`LockHooks` is accepted by both `createLock` and `createSemaphore`.

| Hook | When | Result arg |
|------|------|------------|
| `beforeAcquire` | Before acquire attempt | — |
| `afterAcquire` | After acquire attempt | `{ acquired: boolean }` |
| `beforeRelease` | Before release | — |
| `afterRelease` | After release | `{ released: boolean }` |
| `beforeExtend` | Before extend | — |
| `afterExtend` | After extend | `{ extended: boolean }` |
| `beforeForceRelease` | Before force release | — |
| `afterForceRelease` | After force release | — |

`LockHookContext`: `{ owner, lockable, operation: "acquire" | "release" | "extend" | "forceRelease", ttlMs?, count? }`

### auditLockHooks

Convenience factory wiring only `after*` hooks to named callbacks.

```ts
const hooks = auditLockHooks({
  onAcquire(ctx, { acquired }) { ... },   // after acquire
  onRelease(ctx, { released }) { ... },   // after release
  onExtend(ctx, { extended }) { ... },    // after extend
  onForceRelease(ctx) { ... },            // after force release
});
```

Use raw `LockHooks` if you need `before*` hooks.

## Errors

| Class | Thrown by | Key properties |
|-------|-----------|----------------|
| `LockError` | Base class | — |
| `LockNotHeldError` | `release`, `extend`, `sem.release` (insufficient units) | `lockableKey`, `ownerType`, `ownerId` |
| `LockAlreadyHeldError` | Custom repos / wrappers (core returns `false`) | `lockableKey`, `currentOwnerType`, `currentOwnerId` |
| `SemaphoreCapacityExceededError` | Custom repos / wrappers (core returns `false`) | `lockableKey`, `requested`, `available`, `max` |
| `LockExpiredError` | Custom `LockRepository` implementations | `lockableKey`, `expiresAt` |
| `LockableParamsError` | `defineLockable` call with wrong arity | `lockableName`, `reason` (`"singular_with_params"` \| `"plural_without_params"`) |
| `LockRepositoryError` | Custom `LockRepository` implementations | `operation`, `cause?` |

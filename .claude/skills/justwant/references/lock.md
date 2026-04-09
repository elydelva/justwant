# @justwant/lock

Distributed locks and semaphores. `defineLockable`, `defineLockOwner`, `createLock`, `createSemaphore`.

## Usage

```ts
import { defineLockable, defineLockOwner, createLock, createSemaphore, auditLockHooks } from "@justwant/lock";

const order = defineLockable({ name: "order", singular: false, prefix: "app" });
const maintenance = defineLockable({ name: "maintenance", singular: true });
const user = defineLockOwner({ name: "user", within: "org" });

const lock = createLock({ repo: myLockRepo, hooks: auditLockHooks({ onAcquire, onRelease }) });
const owner = user("org_1", "user_42");
const lockable = order("ord_123"); // key: "app:order:ord_123"

const acquired = await lock.acquire(owner, lockable, { ttlMs: 5000 });
if (acquired) {
  try { /* critical section */ } finally { await lock.release(owner, lockable); }
}

const sem = createSemaphore({ repo: myLockRepo, max: 5 });
const ok = await sem.acquire(owner, lockable, 2);
if (ok) { try { /* use 2 units */ } finally { await sem.release(owner, lockable, 2); } }
const available = await sem.available(lockable);
```

## defineLockable

```ts
const order = defineLockable({ name: "order", singular: false, prefix: "app" });
order("ord_123")              // { type: "order", key: "app:order:ord_123" }
order({ orgId: "o1", id: "ord_1" }) // sorted params: "app:order:id:ord_1:orgId:o1"

const maintenance = defineLockable({ name: "maintenance", singular: true });
maintenance()                  // { type: "maintenance", key: "maintenance" }
```

`LockableDef<N>` extends `Inspectable<N>` — has `name`, `singular`, `prefix`.

## defineLockOwner

```ts
const system = defineLockOwner({ name: "system" });
system("sys_1")                // { type: "system", id: "sys_1" }

const user = defineLockOwner({ name: "user", within: "org" });
user("org_1", "usr_42")        // { type: "user", id: "usr_42", within: { type: "org", id: "org_1" } }
```

`LockOwnerDef<N>` extends `Definable<N>`.

## API

| Method | Signature |
|--------|-----------|
| `lock.acquire` | `(owner, lockable, opts?) → Promise<boolean>` |
| `lock.release` | `(owner, lockable) → Promise<void>` |
| `lock.extend` | `(owner, lockable, ttlMs) → Promise<boolean>` |
| `lock.isLocked` | `(lockable) → Promise<boolean>` |
| `lock.forceRelease` | `(lockable) → Promise<void>` |
| `sem.acquire` | `(owner, lockable, count?) → Promise<boolean>` |
| `sem.release` | `(owner, lockable, count?) → Promise<void>` |
| `sem.available` | `(lockable) → Promise<number>` |

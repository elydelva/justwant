# @justwant/lock

Distributed locks and semaphores. createLockable, createLockOwner, createLock, createSemaphore.

## Usage

```ts
import { createLockable, createLockOwner, createLock, createSemaphore, auditLockHooks } from "@justwant/lock";

const order = createLockable({ name: "order", singular: false, prefix: "app" });
const user = createLockOwner({ name: "user", within: "org" });

const lock = createLock({ repo: myLockRepo, hooks: auditLockHooks({ onAcquire, onRelease }) });
const owner = user("org_1", "user_42");
const lockable = order("ord_123");

const acquired = await lock.acquire(owner, lockable, { ttlMs: 5000 });
if (acquired) {
  try { /* critical section */ } finally { await lock.release(owner, lockable); }
}

const sem = createSemaphore({ repo: myLockRepo, max: 5 });
const ok = await sem.acquire(owner, lockable, 2);
if (ok) { try { /* use 2 units */ } finally { await sem.release(owner, lockable, 2); } }
const available = await sem.available(lockable);
```

## API

createLockable, createLockOwner, createLock, createSemaphore, auditLockHooks

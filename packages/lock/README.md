# @justwant/lock

Distributed locks and semaphores. Mutex, ownership, counting semaphore. Declarative `createLockable`, `createLockOwner`, hooks.

## Installation

```bash
bun add @justwant/lock
# or
npm install @justwant/lock
```

## Usage

### Definitions

```ts
import {
  createLockable,
  createLockOwner,
  createLock,
  createSemaphore,
} from "@justwant/lock";

const maintenance = createLockable({ name: "maintenance", singular: true });
const order = createLockable({
  name: "order",
  singular: false,
  prefix: "app",
});

const system = createLockOwner({ name: "system" });
const user = createLockOwner({ name: "user", within: "org" });
```

### Mutex (createLock)

```ts
const lock = createLock({ repo: myLockRepository });

const owner = user("org_1", "user_42");
const lockable = order("ord_123");

const acquired = await lock.acquire(owner, lockable, { ttlMs: 5000 });
if (acquired) {
  try {
    // critical section
  } finally {
    await lock.release(owner, lockable);
  }
}
```

### Semaphore (createSemaphore)

```ts
const sem = createSemaphore({ repo: myLockRepository, max: 5 });

const acquired = await sem.acquire(owner, lockable, 2);
if (acquired) {
  try {
    // use 2 units
  } finally {
    await sem.release(owner, lockable, 2);
  }
}

const available = await sem.available(lockable);
```

### Hooks

```ts
import { createLock, auditLockHooks } from "@justwant/lock";

const hooks = auditLockHooks({
  onAcquire: (ctx, result) => log("lock.acquire", ctx.lockable.key, result.acquired),
  onRelease: (ctx, result) => log("lock.release", ctx.lockable.key, result.released),
});

const lock = createLock({ repo, hooks });
```

## Exports

| Entry | Content |
|-------|---------|
| `@justwant/lock` | Full API |
| `@justwant/lock/errors` | Error classes |
| `@justwant/lock/types` | LockOwner, Lockable, Lock, LockRepository |
| `@justwant/lock/hooks` | LockHooks, auditLockHooks |
| `@justwant/lock/lock` | createLock (mutex) |
| `@justwant/lock/semaphore` | createSemaphore |
| `@justwant/lock/define` | createLockable, createLockOwner |

## License

MIT

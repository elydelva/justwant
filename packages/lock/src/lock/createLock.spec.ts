import { describe, expect, test } from "bun:test";
import { LockNotHeldError } from "../errors/index.js";
import type { Lock, LockRepository } from "../types/index.js";
import { createLock } from "./createLock.js";

function createMemoryRepo(): LockRepository {
  const store = new Map<string, Lock>();
  let idCounter = 0;
  return {
    async findOne(where) {
      for (const lock of store.values()) {
        if (
          (where.lockableKey === undefined || lock.lockableKey === where.lockableKey) &&
          (where.ownerType === undefined || lock.ownerType === where.ownerType) &&
          (where.ownerId === undefined || lock.ownerId === where.ownerId) &&
          (where.ownerOrgId === undefined || (lock.ownerOrgId ?? undefined) === where.ownerOrgId)
        ) {
          return lock;
        }
      }
      return null;
    },
    async findMany(where) {
      return [...store.values()].filter(
        (l) => where.lockableKey === undefined || l.lockableKey === where.lockableKey
      );
    },
    async create(data) {
      const id = `lock_${++idCounter}`;
      const lock: Lock = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.set(id, lock);
      return lock;
    },
    async update(id, data) {
      const existing = store.get(id);
      if (!existing) throw new Error("Not found");
      const updated = { ...existing, ...data, updatedAt: new Date() };
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      store.delete(id);
    },
  };
}

describe("createLock", () => {
  test("acquire returns true when lock is available", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "order", key: "order:1" };

    const acquired = await lock.acquire(owner, lockable);
    expect(acquired).toBe(true);
    expect(await lock.isLocked(lockable)).toBe(true);
  });

  test("acquire returns false when lock is already held by another owner", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const owner1 = { type: "user", id: "u1" };
    const owner2 = { type: "user", id: "u2" };
    const lockable = { type: "order", key: "order:1" };

    await lock.acquire(owner1, lockable);
    const acquired = await lock.acquire(owner2, lockable);
    expect(acquired).toBe(false);
  });

  test("acquire returns true when same owner already holds lock", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "order", key: "order:1" };

    await lock.acquire(owner, lockable);
    const acquired = await lock.acquire(owner, lockable);
    expect(acquired).toBe(true);
  });

  test("release removes lock when owner holds it", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "order", key: "order:1" };

    await lock.acquire(owner, lockable);
    await lock.release(owner, lockable);
    expect(await lock.isLocked(lockable)).toBe(false);
  });

  test("release throws LockNotHeldError when owner does not hold lock", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const owner1 = { type: "user", id: "u1" };
    const owner2 = { type: "user", id: "u2" };
    const lockable = { type: "order", key: "order:1" };

    await lock.acquire(owner1, lockable);
    await expect(lock.release(owner2, lockable)).rejects.toThrow(LockNotHeldError);
  });

  test("forceRelease removes lock regardless of owner", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "order", key: "order:1" };

    await lock.acquire(owner, lockable);
    await lock.forceRelease(lockable);
    expect(await lock.isLocked(lockable)).toBe(false);
  });

  test("extend updates expiresAt when owner holds lock", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "order", key: "order:1" };

    await lock.acquire(owner, lockable, { ttlMs: 1000 });
    const extended = await lock.extend(owner, lockable, 2000);
    expect(extended).toBe(true);

    const locks = await repo.findMany({ lockableKey: lockable.key });
    expect(locks[0].expiresAt).toBeDefined();
    expect(locks[0].expiresAt?.getTime()).toBeGreaterThan(Date.now() + 1000);
  });

  test("extend throws LockNotHeldError when owner does not hold lock", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({ repo });
    const owner1 = { type: "user", id: "u1" };
    const owner2 = { type: "user", id: "u2" };
    const lockable = { type: "order", key: "order:1" };

    await lock.acquire(owner1, lockable);
    await expect(lock.extend(owner2, lockable, 2000)).rejects.toThrow(LockNotHeldError);
  });

  test("hooks beforeAcquire and afterAcquire are called", async () => {
    const repo = createMemoryRepo();
    const beforeCalls: unknown[] = [];
    const afterCalls: unknown[] = [];
    const lock = createLock({
      repo,
      hooks: {
        beforeAcquire: (ctx) => beforeCalls.push(ctx),
        afterAcquire: (ctx, result) => afterCalls.push({ ctx, result }),
      },
    });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "order", key: "order:1" };

    await lock.acquire(owner, lockable);

    expect(beforeCalls).toHaveLength(1);
    expect((beforeCalls[0] as { lockable: { key: string } }).lockable.key).toBe("order:1");
    expect(afterCalls).toHaveLength(1);
    expect((afterCalls[0] as { result: { acquired: boolean } }).result.acquired).toBe(true);
  });

  test("beforeAcquire can abort by throwing", async () => {
    const repo = createMemoryRepo();
    const lock = createLock({
      repo,
      hooks: {
        beforeAcquire: () => {
          throw new Error("abort");
        },
      },
    });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "order", key: "order:1" };

    await expect(lock.acquire(owner, lockable)).rejects.toThrow("abort");
    expect(await lock.isLocked(lockable)).toBe(false);
  });
});

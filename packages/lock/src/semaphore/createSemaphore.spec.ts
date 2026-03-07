import { describe, expect, test } from "bun:test";
import { LockNotHeldError } from "../errors/index.js";
import type { Lock, LockRepository } from "../types/index.js";
import { createSemaphore } from "./createSemaphore.js";

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

describe("createSemaphore", () => {
  test("acquire returns true when capacity available", async () => {
    const repo = createMemoryRepo();
    const sem = createSemaphore({ repo, max: 5 });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "pool", key: "pool:1" };

    const acquired = await sem.acquire(owner, lockable, 2);
    expect(acquired).toBe(true);
    expect(await sem.available(lockable)).toBe(3);
  });

  test("acquire returns false when capacity exceeded", async () => {
    const repo = createMemoryRepo();
    const sem = createSemaphore({ repo, max: 5 });
    const owner1 = { type: "user", id: "u1" };
    const owner2 = { type: "user", id: "u2" };
    const lockable = { type: "pool", key: "pool:1" };

    await sem.acquire(owner1, lockable, 5);
    const acquired = await sem.acquire(owner2, lockable, 1);
    expect(acquired).toBe(false);
    expect(await sem.available(lockable)).toBe(0);
  });

  test("release frees capacity", async () => {
    const repo = createMemoryRepo();
    const sem = createSemaphore({ repo, max: 5 });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "pool", key: "pool:1" };

    await sem.acquire(owner, lockable, 3);
    await sem.release(owner, lockable, 2);
    expect(await sem.available(lockable)).toBe(4);
  });

  test("release throws LockNotHeldError when owner does not hold units", async () => {
    const repo = createMemoryRepo();
    const sem = createSemaphore({ repo, max: 5 });
    const owner1 = { type: "user", id: "u1" };
    const owner2 = { type: "user", id: "u2" };
    const lockable = { type: "pool", key: "pool:1" };

    await sem.acquire(owner1, lockable, 2);
    await expect(sem.release(owner2, lockable, 1)).rejects.toThrow(LockNotHeldError);
  });

  test("release throws when releasing more than held", async () => {
    const repo = createMemoryRepo();
    const sem = createSemaphore({ repo, max: 5 });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "pool", key: "pool:1" };

    await sem.acquire(owner, lockable, 2);
    await expect(sem.release(owner, lockable, 3)).rejects.toThrow(LockNotHeldError);
  });

  test("available returns max when nothing acquired", async () => {
    const repo = createMemoryRepo();
    const sem = createSemaphore({ repo, max: 10 });
    const lockable = { type: "pool", key: "pool:1" };

    expect(await sem.available(lockable)).toBe(10);
  });

  test("multiple owners can share capacity", async () => {
    const repo = createMemoryRepo();
    const sem = createSemaphore({ repo, max: 5 });
    const owner1 = { type: "user", id: "u1" };
    const owner2 = { type: "user", id: "u2" };
    const lockable = { type: "pool", key: "pool:1" };

    await sem.acquire(owner1, lockable, 2);
    await sem.acquire(owner2, lockable, 2);
    expect(await sem.available(lockable)).toBe(1);
  });

  test("hooks beforeAcquire and afterAcquire are called", async () => {
    const repo = createMemoryRepo();
    const beforeCalls: unknown[] = [];
    const afterCalls: unknown[] = [];
    const sem = createSemaphore({
      repo,
      max: 5,
      hooks: {
        beforeAcquire: (ctx) => beforeCalls.push(ctx),
        afterAcquire: (ctx, result) => afterCalls.push({ ctx, result }),
      },
    });
    const owner = { type: "user", id: "u1" };
    const lockable = { type: "pool", key: "pool:1" };

    await sem.acquire(owner, lockable, 2);

    expect(beforeCalls).toHaveLength(1);
    expect((beforeCalls[0] as { count: number }).count).toBe(2);
    expect(afterCalls).toHaveLength(1);
    expect((afterCalls[0] as { result: { acquired: boolean } }).result.acquired).toBe(true);
  });
});

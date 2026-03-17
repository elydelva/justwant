/**
 * @justwant/lock — createSemaphore
 * Counting semaphore: N holders at a time.
 */

import { toRepo } from "@justwant/actor";
import { LockNotHeldError } from "../errors/index.js";
import type { LockHookContext, LockHooks } from "../hooks/types.js";
import type { CreateInput, Lock, LockOwner, LockRepository, Lockable } from "../types/index.js";

export interface CreateSemaphoreOptions {
  repo: LockRepository;
  max: number;
  hooks?: LockHooks;
}

export interface SemaphoreApi {
  acquire(owner: LockOwner, lockable: Lockable, count?: number): Promise<boolean>;
  release(owner: LockOwner, lockable: Lockable, count?: number): Promise<void>;
  available(lockable: Lockable): Promise<number>;
}

function isExpired(lock: Lock): boolean {
  return !!lock.expiresAt && lock.expiresAt.getTime() < Date.now();
}

function ownerMatches(lock: Lock, owner: LockOwner): boolean {
  const o = toRepo(owner);
  return (
    lock.ownerType === o.actorType &&
    lock.ownerId === o.actorId &&
    (lock.ownerOrgId ?? undefined) === (o.actorOrgId ?? undefined)
  );
}

export function createSemaphore(options: CreateSemaphoreOptions): SemaphoreApi {
  const { repo, max, hooks = {} } = options;

  async function getCurrentCount(lockableKey: string): Promise<number> {
    const locks = await repo.findMany({ lockableKey });
    return locks.filter((l) => !isExpired(l)).reduce((sum, l) => sum + l.count, 0);
  }

  async function acquire(owner: LockOwner, lockable: Lockable, count = 1): Promise<boolean> {
    const ctx: LockHookContext = {
      owner,
      lockable,
      operation: "acquire",
      count,
    };
    await hooks.beforeAcquire?.(ctx);

    const current = await getCurrentCount(lockable.key);
    const available = max - current;

    if (count > available) {
      await hooks.afterAcquire?.(ctx, { acquired: false });
      return false;
    }

    const o = toRepo(owner);
    const existing = await repo.findOne({
      lockableKey: lockable.key,
      ownerType: o.actorType,
      ownerId: o.actorId,
      ownerOrgId: o.actorOrgId ?? undefined,
    });

    if (existing && !isExpired(existing)) {
      await repo.update(existing.id, { count: existing.count + count });
    } else {
      if (existing && isExpired(existing)) {
        await repo.delete(existing.id);
      }
      const lockData: CreateInput<Lock> = {
        lockableKey: lockable.key,
        ownerType: o.actorType,
        ownerId: o.actorId,
        ownerOrgId: o.actorOrgId,
        count,
      };
      await repo.create(lockData);
    }

    await hooks.afterAcquire?.(ctx, { acquired: true });
    return true;
  }

  async function release(owner: LockOwner, lockable: Lockable, count = 1): Promise<void> {
    const ctx: LockHookContext = {
      owner,
      lockable,
      operation: "release",
      count,
    };
    await hooks.beforeRelease?.(ctx);

    const o = toRepo(owner);
    const existing = await repo.findOne({
      lockableKey: lockable.key,
      ownerType: o.actorType,
      ownerId: o.actorId,
      ownerOrgId: o.actorOrgId ?? undefined,
    });

    if (!existing || !ownerMatches(existing, owner)) {
      throw new LockNotHeldError(
        "Semaphore units not held by owner",
        lockable.key,
        o.actorType,
        o.actorId
      );
    }

    if (count > existing.count) {
      throw new LockNotHeldError(
        `Cannot release ${count} units, owner holds ${existing.count}`,
        lockable.key,
        o.actorType,
        o.actorId
      );
    }

    const newCount = existing.count - count;
    if (newCount === 0) {
      await repo.delete(existing.id);
    } else {
      await repo.update(existing.id, { count: newCount });
    }

    await hooks.afterRelease?.(ctx, { released: true });
  }

  async function available(lockable: Lockable): Promise<number> {
    const current = await getCurrentCount(lockable.key);
    return Math.max(0, max - current);
  }

  return {
    acquire,
    release,
    available,
  };
}

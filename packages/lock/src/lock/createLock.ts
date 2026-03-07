/**
 * @justwant/lock — createLock
 * Mutex: one holder at a time.
 */

import { LockNotHeldError } from "../errors/index.js";
import type { LockHookContext, LockHooks } from "../hooks/types.js";
import type { CreateInput, Lock, LockOwner, LockRepository, Lockable } from "../types/index.js";

export interface CreateLockOptions {
  repo: LockRepository;
  hooks?: LockHooks;
}

export interface LockApi {
  acquire(owner: LockOwner, lockable: Lockable, opts?: { ttlMs?: number }): Promise<boolean>;
  release(owner: LockOwner, lockable: Lockable): Promise<void>;
  isLocked(lockable: Lockable): Promise<boolean>;
  forceRelease(lockable: Lockable): Promise<void>;
  extend(owner: LockOwner, lockable: Lockable, ttlMs: number): Promise<boolean>;
}

function isExpired(lock: Lock): boolean {
  return !!lock.expiresAt && lock.expiresAt.getTime() < Date.now();
}

function ownerMatches(lock: Lock, owner: LockOwner): boolean {
  return (
    lock.ownerType === owner.type &&
    lock.ownerId === owner.id &&
    (lock.ownerOrgId ?? undefined) === (owner.orgId ?? undefined)
  );
}

export function createLock(options: CreateLockOptions): LockApi {
  const { repo, hooks = {} } = options;

  async function acquire(
    owner: LockOwner,
    lockable: Lockable,
    opts?: { ttlMs?: number }
  ): Promise<boolean> {
    const ctx: LockHookContext = {
      owner,
      lockable,
      operation: "acquire",
      ttlMs: opts?.ttlMs,
    };
    await hooks.beforeAcquire?.(ctx);

    const existing = await repo.findOne({ lockableKey: lockable.key });

    if (existing) {
      if (isExpired(existing)) {
        await repo.delete(existing.id);
      } else {
        if (ownerMatches(existing, owner)) {
          await hooks.afterAcquire?.(ctx, { acquired: true });
          return true;
        }
        await hooks.afterAcquire?.(ctx, { acquired: false });
        return false;
      }
    }

    const ttlMs = opts?.ttlMs;
    const lockData: CreateInput<Lock> = {
      lockableKey: lockable.key,
      ownerType: owner.type,
      ownerId: owner.id,
      ownerOrgId: owner.orgId,
      count: 1,
      expiresAt: ttlMs ? new Date(Date.now() + ttlMs) : undefined,
    };
    await repo.create(lockData);

    await hooks.afterAcquire?.(ctx, { acquired: true });
    return true;
  }

  async function release(owner: LockOwner, lockable: Lockable): Promise<void> {
    const ctx: LockHookContext = { owner, lockable, operation: "release" };
    await hooks.beforeRelease?.(ctx);

    const existing = await repo.findOne({
      lockableKey: lockable.key,
      ownerType: owner.type,
      ownerId: owner.id,
      ownerOrgId: owner.orgId ?? undefined,
    });

    if (!existing || !ownerMatches(existing, owner)) {
      throw new LockNotHeldError("Lock not held by owner", lockable.key, owner.type, owner.id);
    }

    await repo.delete(existing.id);
    await hooks.afterRelease?.(ctx, { released: true });
  }

  async function isLocked(lockable: Lockable): Promise<boolean> {
    const existing = await repo.findOne({ lockableKey: lockable.key });
    if (!existing) return false;
    if (isExpired(existing)) return false;
    return true;
  }

  async function forceRelease(lockable: Lockable): Promise<void> {
    const ctx: LockHookContext = {
      owner: { type: "system", id: "force" },
      lockable,
      operation: "forceRelease",
    };
    await hooks.beforeForceRelease?.(ctx);

    const locks = await repo.findMany({ lockableKey: lockable.key });
    for (const lock of locks) {
      await repo.delete(lock.id);
    }

    await hooks.afterForceRelease?.(ctx);
  }

  async function extend(owner: LockOwner, lockable: Lockable, ttlMs: number): Promise<boolean> {
    const ctx: LockHookContext = {
      owner,
      lockable,
      operation: "extend",
      ttlMs,
    };
    await hooks.beforeExtend?.(ctx);

    const existing = await repo.findOne({
      lockableKey: lockable.key,
      ownerType: owner.type,
      ownerId: owner.id,
      ownerOrgId: owner.orgId ?? undefined,
    });

    if (!existing || !ownerMatches(existing, owner)) {
      throw new LockNotHeldError(
        "Lock not held by owner, cannot extend",
        lockable.key,
        owner.type,
        owner.id
      );
    }

    await repo.update(existing.id, {
      expiresAt: new Date(Date.now() + ttlMs),
    });

    await hooks.afterExtend?.(ctx, { extended: true });
    return true;
  }

  return {
    acquire,
    release,
    isLocked,
    forceRelease,
    extend,
  };
}

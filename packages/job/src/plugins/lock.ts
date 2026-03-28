/**
 * @justwant/job — lockPlugin
 * Prevents double execution across instances using distributed lock.
 */

import type { LockApi, LockOwner, Lockable } from "@justwant/lock";
import type { JobPlugin } from "../types.js";

export interface LockPluginOptions {
  lock: LockApi;
  owner?: LockOwner;
  ttlMs?: number;
}

const defaultOwner: LockOwner = { type: "job", id: "default" };

export function lockPlugin(options: LockPluginOptions): JobPlugin {
  const { lock, owner = defaultOwner, ttlMs = 60_000 } = options;

  return {
    beforeExecute: async (ctx, next) => {
      const lockable: Lockable = { type: "job", key: `job:${ctx.jobId}` };
      const acquired = await lock.acquire(owner, lockable, { ttlMs });
      if (!acquired) {
        return; // Another instance is running, skip
      }
      try {
        await next();
      } finally {
        try {
          await lock.release(owner, lockable);
        } catch {
          // Ignore release errors (e.g. lock expired)
        }
      }
    },
  };
}

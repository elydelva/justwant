/**
 * @justwant/waitlist — expirationPlugin
 * Cleanup of expired waitlist entries.
 */

import { actorKey, fromRepo } from "@justwant/actor";
import type { WaitlistRepository } from "../types.js";

export interface ExpirationPluginOptions {
  repo: WaitlistRepository;
}

/**
 * Removes expired entries from a list.
 * Call periodically (e.g. via cron) or on-demand.
 */
export async function cleanupExpired(repo: WaitlistRepository, listKey: string): Promise<number> {
  const now = new Date();
  const entries = await repo.findMany({ listKey });
  let removed = 0;
  for (const entry of entries) {
    if (entry.expiresAt && entry.expiresAt < now) {
      const key = actorKey(fromRepo(entry));
      await repo.unsubscribe(listKey, key);
      removed++;
    }
  }
  return removed;
}

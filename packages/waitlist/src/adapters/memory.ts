/**
 * @justwant/waitlist — In-memory adapter
 * For testing and development.
 */

import { randomUUID } from "node:crypto";
import { parseActorKey, toRepo } from "@justwant/actor";
import type { FindManyOptions, WaitlistEntry, WaitlistRepository } from "../types.js";

export function createMemoryWaitlistAdapter(): WaitlistRepository {
  const entries: WaitlistEntry[] = [];

  return {
    async subscribe(entry): Promise<WaitlistEntry> {
      const now = new Date();
      const full: WaitlistEntry = {
        ...entry,
        id: randomUUID(),
        createdAt: now,
      };
      entries.push(full);
      return full;
    },

    async unsubscribe(listKey: string, actorKeyStr: string): Promise<void> {
      const actor = parseActorKey(actorKeyStr);
      const shape = toRepo(actor);
      const idx = entries.findIndex(
        (e) =>
          e.listKey === listKey &&
          e.actorType === shape.actorType &&
          e.actorId === shape.actorId &&
          (e.actorOrgId ?? undefined) === (shape.actorOrgId ?? undefined)
      );
      if (idx >= 0) {
        entries.splice(idx, 1);
      }
    },

    async findOne(where): Promise<WaitlistEntry | null> {
      const match = entries.find((e) =>
        Object.entries(where).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v)
      );
      return match ?? null;
    },

    async findMany(where, opts): Promise<WaitlistEntry[]> {
      let rows = entries.filter((e) =>
        Object.entries(where).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v)
      );
      if (opts?.orderBy) {
        const { field, direction } = opts.orderBy;
        rows = [...rows].sort((a, b) => {
          const aVal = (a as unknown as Record<string, unknown>)[field] ?? "";
          const bVal = (b as unknown as Record<string, unknown>)[field] ?? "";
          const cmp = aVal < bVal ? -1 : Number(aVal > bVal);
          return direction === "desc" ? -cmp : cmp;
        });
      }
      const offset = opts?.offset ?? 0;
      const limit = opts?.limit;
      return limit ? rows.slice(offset, offset + limit) : rows.slice(offset);
    },

    async count(where): Promise<number> {
      return entries.filter((e) =>
        Object.entries(where).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v)
      ).length;
    },

    async delete(id: string): Promise<void> {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx >= 0) entries.splice(idx, 1);
    },
  };
}

/**
 * @justwant/waitlist — DB adapter
 * Implements WaitlistRepository using a table-like interface.
 */

import { parseActorKey, toRepo } from "@justwant/actor";
import type { FindManyOptions, WaitlistEntry, WaitlistRepository } from "../types.js";

/** Table interface — compatible with @justwant/db MappedTable. */
export interface WaitlistTable {
  create(data: Omit<WaitlistEntry, "id" | "createdAt">): Promise<WaitlistEntry>;
  findOne(where: Partial<WaitlistEntry>): Promise<WaitlistEntry | null>;
  findMany(where: Partial<WaitlistEntry>): Promise<WaitlistEntry[]>;
  delete(id: string): Promise<void>;
}

export interface CreateWaitlistDbAdapterOptions {
  table: WaitlistTable;
}

/**
 * Creates a WaitlistRepository from a table (e.g. @justwant/db MappedTable).
 * For findMany with orderBy/limit/offset, fetches all and filters in memory
 * when the table doesn't support those options.
 */
export function createWaitlistDbAdapter(
  options: CreateWaitlistDbAdapterOptions
): WaitlistRepository {
  const { table } = options;

  return {
    async subscribe(entry): Promise<WaitlistEntry> {
      const now = new Date();
      const data = { ...entry, createdAt: now };
      for (const key of Object.keys(data) as (keyof typeof data)[]) {
        if (data[key] === undefined) {
          delete data[key];
        }
      }
      return table.create(data);
    },

    async unsubscribe(listKey: string, actorKeyStr: string): Promise<void> {
      const actor = parseActorKey(actorKeyStr);
      const shape = toRepo(actor);
      const where: Partial<WaitlistEntry> = {
        listKey,
        actorType: shape.actorType,
        actorId: shape.actorId,
      };
      if (shape.actorOrgId != null) where.actorOrgId = shape.actorOrgId;
      const entry = await table.findOne(where);
      if (entry) {
        await table.delete(entry.id);
      }
    },

    async findOne(where): Promise<WaitlistEntry | null> {
      return table.findOne(where);
    },

    async findMany(where, opts): Promise<WaitlistEntry[]> {
      let rows = await table.findMany(where);
      if (opts?.orderBy) {
        const { field, direction } = opts.orderBy;
        rows = [...rows].sort((a, b) => {
          const aVal = a[field] ?? "";
          const bVal = b[field] ?? "";
          let cmp: number;
          if (aVal < bVal) cmp = -1;
          else if (aVal > bVal) cmp = 1;
          else cmp = 0;
          return direction === "desc" ? -cmp : cmp;
        });
      }
      const offset = opts?.offset ?? 0;
      const limit = opts?.limit;
      const sliced = limit ? rows.slice(offset, offset + limit) : rows.slice(offset);
      return sliced;
    },

    async count(where): Promise<number> {
      const rows = await table.findMany(where);
      return rows.length;
    },

    async delete(id: string): Promise<void> {
      return table.delete(id);
    },
  };
}

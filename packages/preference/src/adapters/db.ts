/**
 * @justwant/preference — DB adapter
 * Implements PreferenceRepository using a table-like interface.
 */

import type {
  CreateInput,
  FindManyOptions,
  PreferenceEntry,
  PreferenceRepository,
} from "../types.js";

/** Table interface — compatible with @justwant/db MappedTable. */
export interface PreferenceTable {
  create(
    data: Omit<PreferenceEntry, "id" | "createdAt" | "updatedAt"> & {
      createdAt?: Date;
      updatedAt?: Date;
    }
  ): Promise<PreferenceEntry>;
  findOne(where: Partial<PreferenceEntry>): Promise<PreferenceEntry | null>;
  findMany(where: Partial<PreferenceEntry>): Promise<PreferenceEntry[]>;
  update(id: string, data: Partial<PreferenceEntry>): Promise<PreferenceEntry>;
  delete(id: string): Promise<void>;
}

export interface CreatePreferenceDbAdapterOptions {
  table: PreferenceTable;
}

/**
 * Creates a PreferenceRepository from a table (e.g. @justwant/db MappedTable).
 * For findMany with orderBy/limit/offset, fetches all and filters in memory
 * when the table doesn't support those options.
 */
export function createPreferenceDbAdapter(
  options: CreatePreferenceDbAdapterOptions
): PreferenceRepository {
  const { table } = options;

  return {
    async create(data: CreateInput<PreferenceEntry>): Promise<PreferenceEntry> {
      const now = new Date();
      const clean: Record<string, unknown> = { ...data };
      clean.id = undefined;
      clean.createdAt = data.createdAt ?? now;
      clean.updatedAt = data.updatedAt ?? now;
      for (const key of Object.keys(clean)) {
        if (clean[key] === undefined) {
          delete clean[key];
        }
      }
      return table.create(
        clean as Omit<PreferenceEntry, "id" | "createdAt" | "updatedAt"> & {
          createdAt: Date;
          updatedAt: Date;
        }
      );
    },

    async findOne(where: Partial<PreferenceEntry>): Promise<PreferenceEntry | null> {
      return table.findOne(where);
    },

    async findMany(
      where: Partial<PreferenceEntry>,
      opts?: FindManyOptions
    ): Promise<PreferenceEntry[]> {
      let rows = await table.findMany(where);
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

    async update(id: string, data: Partial<PreferenceEntry>): Promise<PreferenceEntry> {
      return table.update(id, data);
    },

    async delete(id: string): Promise<void> {
      return table.delete(id);
    },
  };
}

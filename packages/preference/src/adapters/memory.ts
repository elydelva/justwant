/**
 * @justwant/preference — In-memory adapter
 * For testing and development.
 */

import { randomUUID } from "node:crypto";
import type {
  CreateInput,
  FindManyOptions,
  PreferenceEntry,
  PreferenceRepository,
} from "../types.js";

export function createMemoryPreferenceAdapter(): PreferenceRepository {
  const entries: PreferenceEntry[] = [];

  return {
    async create(data: CreateInput<PreferenceEntry>): Promise<PreferenceEntry> {
      const now = new Date();
      const full: PreferenceEntry = {
        ...data,
        id: data.id ?? randomUUID(),
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      };
      entries.push(full);
      return full;
    },

    async findOne(where: Partial<PreferenceEntry>): Promise<PreferenceEntry | null> {
      const match = entries.find((e) =>
        Object.entries(where).every(([k, v]) => {
          const ev = (e as unknown as Record<string, unknown>)[k];
          if (k === "actorOrgId" && (v === null || v === undefined)) {
            return ev === null || ev === undefined;
          }
          return ev === v;
        })
      );
      return match ?? null;
    },

    async findMany(
      where: Partial<PreferenceEntry>,
      opts?: FindManyOptions
    ): Promise<PreferenceEntry[]> {
      const matches = (e: PreferenceEntry) =>
        Object.entries(where).every(([k, v]) => {
          const ev = (e as unknown as Record<string, unknown>)[k];
          if (k === "actorOrgId" && (v === null || v === undefined)) {
            return ev === null || ev === undefined;
          }
          return ev === v;
        });
      let rows = entries.filter(matches);
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
      const idx = entries.findIndex((e) => e.id === id);
      const existing = entries[idx];
      if (idx < 0 || !existing) {
        throw new Error(`PreferenceEntry not found: ${id}`);
      }
      const updated: PreferenceEntry = {
        id: existing.id,
        preferenceKey: data.preferenceKey ?? existing.preferenceKey,
        actorType: data.actorType ?? existing.actorType,
        actorId: data.actorId ?? existing.actorId,
        actorOrgId: data.actorOrgId !== undefined ? data.actorOrgId : existing.actorOrgId,
        value: data.value !== undefined ? data.value : existing.value,
        createdAt: data.createdAt ?? existing.createdAt,
        updatedAt: new Date(),
      };
      entries[idx] = updated;
      return updated;
    },

    async delete(id: string): Promise<void> {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx >= 0) entries.splice(idx, 1);
    },
  };
}

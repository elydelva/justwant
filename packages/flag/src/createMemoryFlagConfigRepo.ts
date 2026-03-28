/**
 * @justwant/flag — In-memory FlagConfigRepo
 * For testing and development.
 */

import { randomUUID } from "node:crypto";
import type { ConfigOverride, CreateInput, FindManyOptions, FlagConfigRepo } from "./types.js";

export function createMemoryFlagConfigRepo(): FlagConfigRepo {
  const overrides: ConfigOverride[] = [];
  let seq = 0;
  const seqMap = new Map<string, number>();

  return {
    async create(data: CreateInput<ConfigOverride>): Promise<ConfigOverride> {
      const now = new Date();
      const full: ConfigOverride = {
        ...data,
        id: data.id ?? randomUUID(),
        ruleId: data.ruleId,
        config: data.config ?? {},
        rolledBack: data.rolledBack ?? false,
        createdAt: data.createdAt ?? now,
      };
      seqMap.set(full.id, seq++);
      overrides.push(full);
      return full;
    },

    async findOne(where: Partial<ConfigOverride>): Promise<ConfigOverride | null> {
      const match = overrides.find((e) =>
        Object.entries(where).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v)
      );
      return match ?? null;
    },

    async findMany(
      where: Partial<ConfigOverride>,
      opts?: FindManyOptions
    ): Promise<ConfigOverride[]> {
      let rows = overrides.filter((e) =>
        Object.entries(where).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v)
      );
      if (opts?.orderBy) {
        const { field, direction } = opts.orderBy;
        rows = [...rows].sort((a, b) => {
          const aVal = (a as unknown as Record<string, unknown>)[field] ?? "";
          const bVal = (b as unknown as Record<string, unknown>)[field] ?? "";
          let cmp: number;
          if (aVal < bVal) cmp = -1;
          else if (aVal > bVal) cmp = 1;
          else cmp = (seqMap.get(a.id) ?? 0) - (seqMap.get(b.id) ?? 0);
          return direction === "desc" ? -cmp : cmp;
        });
      }
      const offset = opts?.offset ?? 0;
      const limit = opts?.limit;
      return limit ? rows.slice(offset, offset + limit) : rows.slice(offset);
    },

    async count(where: Partial<ConfigOverride>): Promise<number> {
      return overrides.filter((e) =>
        Object.entries(where).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v)
      ).length;
    },

    async update(id: string, data: { rolledBack: boolean }): Promise<ConfigOverride> {
      const idx = overrides.findIndex((e) => e.id === id);
      const prev = overrides[idx];
      if (!prev) {
        throw new Error(`ConfigOverride not found: ${id}`);
      }
      const updated: ConfigOverride = {
        id: prev.id,
        ruleId: prev.ruleId,
        config: prev.config,
        rolledBack: data.rolledBack,
        createdAt: prev.createdAt,
      };
      overrides[idx] = updated;
      return updated;
    },
  };
}

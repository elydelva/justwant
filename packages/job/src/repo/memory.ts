/**
 * @justwant/job — MemoryJobRepository
 * In-memory implementation for tests. No persistence.
 */

import type { JobDefinition, JobRepository, JobStats, SkipNextUntil } from "../types.js";

export function createMemoryJobRepository(): JobRepository {
  const definitions = new Map<string, JobDefinition>();
  const paused = new Map<string, boolean>();
  const skipNextUntil = new Map<string, SkipNextUntil>();
  const runs = new Map<string, number>();
  const failures = new Map<string, number>();

  return {
    async getDefinition(id: string): Promise<JobDefinition | null> {
      return definitions.get(id) ?? null;
    },

    async listDefinitions(): Promise<JobDefinition[]> {
      return [...definitions.values()];
    },

    async saveDefinition(def: JobDefinition): Promise<void> {
      definitions.set(def.name, def);
    },

    async deleteDefinition(id: string): Promise<void> {
      definitions.delete(id);
      paused.delete(id);
      skipNextUntil.delete(id);
      runs.delete(id);
      failures.delete(id);
    },

    async getPaused(id: string): Promise<boolean> {
      return paused.get(id) ?? false;
    },

    async setPaused(id: string, value: boolean): Promise<void> {
      paused.set(id, value);
    },

    async getStats(id: string): Promise<JobStats> {
      return {
        runs: runs.get(id) ?? 0,
        failures: failures.get(id) ?? 0,
      };
    },

    async incrementRuns(id: string): Promise<void> {
      runs.set(id, (runs.get(id) ?? 0) + 1);
    },

    async incrementFailures(id: string): Promise<void> {
      failures.set(id, (failures.get(id) ?? 0) + 1);
    },

    async getSkipNextUntil(id: string): Promise<SkipNextUntil> {
      return skipNextUntil.get(id) ?? null;
    },

    async setSkipNextUntil(id: string, value: SkipNextUntil): Promise<void> {
      if (value === null) {
        skipNextUntil.delete(id);
      } else {
        skipNextUntil.set(id, value);
      }
    },
  };
}

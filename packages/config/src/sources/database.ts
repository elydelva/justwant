/**
 * @justwant/config — defineDatabaseSource
 * Source that reads from a key-value store (database).
 */

import type { ConfigSource, SourceLookup } from "../types/index.js";

export interface ConfigEntry {
  key: string;
  value: unknown;
}

export interface ConfigRepo {
  findOne(where: { key: string }): Promise<ConfigEntry | null>;
}

export interface DefineDatabaseSourceOptions {
  repo: ConfigRepo;
}

export function defineDatabaseSource(options: DefineDatabaseSourceOptions): ConfigSource {
  const { repo } = options;

  return {
    async get(lookup: SourceLookup): Promise<unknown> {
      if (!("key" in lookup)) return undefined;
      const entry = await repo.findOne({ key: lookup.key });
      return entry?.value;
    },
  };
}

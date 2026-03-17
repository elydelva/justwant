/**
 * @justwant/preference — Core types
 */

import type { Actor } from "@justwant/actor";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export type { Actor };

/** Persisted preference entry. */
export interface PreferenceEntry {
  id: string;
  preferenceKey: string;
  actorType: string;
  actorId: string;
  actorOrgId?: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/** Portable preference definition. */
export interface PreferenceDef<T = unknown> {
  readonly id: string;
  readonly key: string;
  readonly schema?: StandardSchemaV1<unknown, T>;
  readonly default?: T;
}

/** Options for findMany. */
export interface FindManyOptions {
  orderBy?: { field: keyof PreferenceEntry; direction: "asc" | "desc" };
  limit?: number;
  offset?: number;
}

/** Repository interface — user provides implementation (e.g. via @justwant/db). */
export interface PreferenceRepository {
  create(data: CreateInput<PreferenceEntry>): Promise<PreferenceEntry>;
  findOne(where: Partial<PreferenceEntry>): Promise<PreferenceEntry | null>;
  findMany(where: Partial<PreferenceEntry>, opts?: FindManyOptions): Promise<PreferenceEntry[]>;
  update(id: string, data: Partial<PreferenceEntry>): Promise<PreferenceEntry>;
  delete(id: string): Promise<void>;
}

export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

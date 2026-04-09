/**
 * @justwant/preference — Core types
 */

import type { Definable } from "@justwant/meta";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export type { Actor } from "@justwant/actor";

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

/** Portable preference definition. Callable: pref(actorId) → { type: N; id: actorId }. */
export interface PreferenceDef<N extends string = string, T = unknown> extends Definable<N> {
  readonly name: N;
  /** Storage key — defaults to name. */
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

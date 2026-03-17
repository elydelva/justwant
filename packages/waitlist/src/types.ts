/**
 * @justwant/waitlist — Core types
 */

import type { Actor } from "@justwant/actor";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export type { Actor };

/** Schema for metadata validation (optional). */
export type WaitlistMetadataSchema<T = unknown> = StandardSchemaV1<unknown, T>;

/** Persisted waitlist entry. */
export interface WaitlistEntry {
  id: string;
  listKey: string;
  actorType: string;
  actorId: string;
  actorOrgId?: string;
  position?: number;
  priority?: number;
  metadata?: Record<string, unknown>;
  referredBy?: string;
  createdAt: Date;
  expiresAt?: Date;
}

/** Options for findMany. */
export interface FindManyOptions {
  orderBy?: { field: keyof WaitlistEntry; direction: "asc" | "desc" };
  limit?: number;
  offset?: number;
}

/** Plugin context for operation hooks. */
export interface WaitlistPluginContext {
  operation: string;
  listKey: string;
  actor?: Actor;
  entry?: WaitlistEntry;
  [key: string]: unknown;
}

/** Plugin interface — wraps operations. */
export interface WaitlistPlugin {
  init?(context: { setContext?(key: string, value: unknown): void }): void;
  beforeExecute?(ctx: WaitlistPluginContext, next: () => Promise<unknown>): Promise<unknown>;
  afterExecute?(ctx: WaitlistPluginContext, next: () => Promise<unknown>): Promise<unknown>;
  onError?(ctx: { operation: string; error: unknown }): Promise<void>;
}

/** Repository interface — user provides implementation (e.g. via @justwant/db). */
export interface WaitlistRepository {
  subscribe(entry: Omit<WaitlistEntry, "id" | "createdAt">): Promise<WaitlistEntry>;
  unsubscribe(listKey: string, actorKey: string): Promise<void>;
  findOne(where: Partial<WaitlistEntry>): Promise<WaitlistEntry | null>;
  findMany(where: Partial<WaitlistEntry>, opts?: FindManyOptions): Promise<WaitlistEntry[]>;
  count(where: Partial<WaitlistEntry>): Promise<number>;
  delete(id: string): Promise<void>;
}

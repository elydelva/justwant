/**
 * @justwant/lock — Core types
 * LockOwner and Lockable type names are user-defined (string).
 * Use defineLockOwner/defineLockable generics for literal inference.
 */

import type { Actor } from "@justwant/actor";

/** LockOwner — Actor from @justwant/actor. Alias for backward compat. */
export type LockOwner<T extends string = string> = Actor<T>;

/** Lockable — what can be locked. key is the deterministic lock key. */
export interface Lockable<N extends string = string> {
  type: N;
  key: string;
}

/** Lock — persisted entity in LockRepository */
export interface Lock {
  id: string;
  lockableKey: string;
  ownerType: string;
  ownerId: string;
  ownerOrgId?: string;
  count: number;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

export interface LockRepository {
  findOne(where: Partial<Lock>): Promise<Lock | null>;
  findMany(where: Partial<Lock>): Promise<Lock[]>;
  create(data: CreateInput<Lock>): Promise<Lock>;
  update(id: string, data: Partial<Lock>): Promise<Lock>;
  delete(id: string): Promise<void>;
}

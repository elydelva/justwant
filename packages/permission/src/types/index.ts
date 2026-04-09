/**
 * @justwant/permission — Core types
 * Actor and scope type names are user-defined (string). Use defineScope/defineActor
 * generics for literal inference and build-time type safety.
 * IdentityLike, ReferenceLike, ScopeLike: structural interfaces for cross-package composition.
 */

export type { IdentityLike, Actor } from "@justwant/actor";
export type { Resource } from "@justwant/resource";

/**
 * ReferenceLike — structural alias for Definable<string>.
 * Kept for backward compatibility with existing consumers.
 */
export type { Definable as ReferenceLike } from "@justwant/meta";

/** Structural interface for scope-like definitions */
export interface ScopeLike {
  readonly name: string;
  (id?: string): { type: string; id?: string | null };
}

export type OverrideType = "grant" | "deny";

/** Scope — type is user-defined via defineScope({ name }) */
export interface Scope<T extends string = string> {
  type: T;
  id?: string | null;
}

/** Persistence entity — actorType/scopeType are strings (user-defined) */
export interface Assignment {
  id: string;
  actorType: string;
  actorId: string;
  role: string;
  scopeType: string;
  scopeId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Override {
  id: string;
  type: OverrideType;
  actorType: string;
  actorId: string;
  permission: string;
  scopeType: string;
  scopeId: string | null;
  resourceType?: string;
  resourceId?: string;
  grantedBy?: string;
  deniedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

export interface PermissionRepository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  findOne(where: Partial<T>): Promise<T | null>;
  findMany(where: Partial<T>): Promise<T[]>;
  create(data: CreateInput<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface AssignmentsRepo extends PermissionRepository<Assignment> {}
export interface OverridesRepo extends PermissionRepository<Override> {}

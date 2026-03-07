/**
 * @justwant/permission — Core types
 * Actor and scope type names are user-defined (string). Use createScope/createActor
 * generics for literal inference and build-time type safety.
 */

export type OverrideType = "grant" | "deny";

/** Actor — type is user-defined via createActor({ name }) */
export interface Actor<T extends string = string> {
  type: T;
  id: string;
  orgId?: string;
}

/** Scope — type is user-defined via createScope({ name }) */
export interface Scope<T extends string = string> {
  type: T;
  id?: string | null;
  orgId?: string;
}

export interface Resource {
  type: string;
  id: string;
  orgId?: string;
}

/** Persistence entity — actorType/scopeType are strings (user-defined) */
export interface Assignment {
  id: string;
  actorType: string;
  actorId: string;
  actorOrgId?: string;
  role: string;
  scopeType: string;
  scopeId: string | null;
  scopeOrgId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Override {
  id: string;
  type: OverrideType;
  actorType: string;
  actorId: string;
  actorOrgId?: string;
  permission: string;
  scopeType: string;
  scopeId: string | null;
  scopeOrgId?: string;
  resourceType?: string;
  resourceId?: string;
  resourceOrgId?: string;
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

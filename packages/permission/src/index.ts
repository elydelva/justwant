/**
 * @justwant/permission — RBAC/ABAC with data-agnostic repos
 */

export { createScope } from "./define/scope/createScope.js";
export type { CreateScopeOptions, ScopeDef } from "./define/scope/createScope.js";

export { createActor } from "./define/actor/createActor.js";
export type { CreateActorOptions, ActorDef } from "./define/actor/createActor.js";

export { createResource } from "./define/resource/createResource.js";
export type { CreateResourceOptions, ResourceDef } from "./define/resource/createResource.js";

export { createAtomicPermission } from "./define/permission/createAtomicPermission.js";
export type {
  AtomicPermission,
  CreateAtomicPermissionOptions,
} from "./define/permission/createAtomicPermission.js";

export { createPermissionDomain } from "./define/permission/createPermissionDomain.js";
export type { PermissionDomain } from "./define/permission/createPermissionDomain.js";

export { createRole } from "./define/role/createRole.js";
export type { CreateRoleOptions, RoleDef } from "./define/role/createRole.js";

export { createRealm } from "./define/realm/createRealm.js";
export type {
  CreateRealmOptions,
  RealmDef,
} from "./define/realm/createRealm.js";

export { createPermission } from "./permission.js";
export type {
  AssertParams,
  AssignParams,
  CanAllParams,
  CanManyParams,
  CanParams,
  CreatePermissionOptions,
  HasRoleParams,
  PermissionApi,
  RealmParams,
  RevokeAllParams,
  RevokeScopeParams,
  UnassignParams,
} from "./permission.js";

export type {
  PermissionRepository,
  AssignmentsRepo,
  OverridesRepo,
  Assignment,
  Override,
  CreateInput,
} from "./types/index.js";

export {
  PermissionError,
  PermissionDeniedError,
  CeilingViolationError,
} from "./errors/index.js";

export type { Actor, Scope, Resource } from "./types/index.js";

/**
 * @justwant/permission — RBAC/ABAC with data-agnostic repos
 */

export { defineScope } from "./define/scope/defineScope.js";
export type { DefineScopeOptions, ScopeDef } from "./define/scope/defineScope.js";

export { defineActor } from "./define/actor/defineActor.js";
export type {
  DefineActorOptions,
  DefineActorOptionsWithName,
  DefineActorOptionsWithWithin,
  DefineActorOptionsWithFrom,
  ActorDef,
} from "./define/actor/defineActor.js";

export { defineResource } from "@justwant/resource";
export type { ResourceDef } from "@justwant/resource";

export { defineAtomicPermission } from "./define/permission/defineAtomicPermission.js";
export type {
  AtomicPermission,
  DefineAtomicPermissionOptions,
} from "./define/permission/defineAtomicPermission.js";

export { defineRole } from "./define/role/defineRole.js";
export type { DefineRoleOptions, RoleDef } from "./define/role/defineRole.js";

export { defineRealm } from "./define/realm/defineRealm.js";
export type {
  DefineRealmOptions,
  RealmDef,
} from "./define/realm/defineRealm.js";

export { createPermissionService } from "./createPermissionService.js";
export type {
  CreatePermissionServiceOptions,
  PermissionApi,
  CanParams,
  AssertParams,
  AssignParams,
  HasRoleParams,
  UnassignParams,
  CanAllParams,
  CanManyParams,
  RevokeScopeParams,
  RevokeAllParams,
  RealmParams,
} from "./createPermissionService.js";

export type {
  PermissionRepository,
  AssignmentsRepo,
  OverridesRepo,
  Assignment,
  Override,
  CreateInput,
  IdentityLike,
  ReferenceLike,
  ScopeLike,
} from "./types/index.js";

export {
  PermissionError,
  PermissionDeniedError,
  CeilingViolationError,
} from "./errors/index.js";

export type { Actor, Scope, Resource } from "./types/index.js";

/**
 * @justwant/lock — Distributed locks and semaphores
 */

export { defineLockable } from "./define/lockable/defineLockable.js";
export type { DefineLockableOptions, LockableDef } from "./define/lockable/defineLockable.js";

export { defineLockOwner } from "./define/owner/defineLockOwner.js";
export type { DefineLockOwnerOptions, LockOwnerDef } from "./define/owner/defineLockOwner.js";

export { createLock } from "./lock/createLock.js";
export type { CreateLockOptions, LockApi } from "./lock/createLock.js";

export { createSemaphore } from "./semaphore/createSemaphore.js";
export type { CreateSemaphoreOptions, SemaphoreApi } from "./semaphore/createSemaphore.js";

export type { LockHooks, LockHookContext, LockOperation } from "./hooks/types.js";
export { auditLockHooks } from "./hooks/auditLockHooks.js";
export type { AuditLockHooksOptions } from "./hooks/auditLockHooks.js";

export type {
  LockOwner,
  Lockable,
  Lock,
  LockRepository,
  CreateInput,
} from "./types/index.js";

export {
  LockError,
  LockNotHeldError,
  LockAlreadyHeldError,
  SemaphoreCapacityExceededError,
  LockExpiredError,
  LockableParamsError,
  LockRepositoryError,
} from "./errors/index.js";

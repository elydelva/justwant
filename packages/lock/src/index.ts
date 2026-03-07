/**
 * @justwant/lock — Distributed locks and semaphores
 */

export { createLockable } from "./define/lockable/createLockable.js";
export type { CreateLockableOptions, LockableDef } from "./define/lockable/createLockable.js";

export { createLockOwner } from "./define/owner/createLockOwner.js";
export type { CreateLockOwnerOptions, LockOwnerDef } from "./define/owner/createLockOwner.js";

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

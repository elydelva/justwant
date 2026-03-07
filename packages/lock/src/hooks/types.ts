/**
 * @justwant/lock — Hook types
 */

import type { LockOwner } from "../types/index.js";
import type { Lockable } from "../types/index.js";

export type LockOperation = "acquire" | "release" | "extend" | "forceRelease";

export interface LockHookContext {
  owner: LockOwner;
  lockable: Lockable;
  operation: LockOperation;
  ttlMs?: number;
  count?: number;
}

export interface LockHooks {
  beforeAcquire?(ctx: LockHookContext): void | Promise<void>;
  afterAcquire?(ctx: LockHookContext, result: { acquired: boolean }): void | Promise<void>;
  beforeRelease?(ctx: LockHookContext): void | Promise<void>;
  afterRelease?(ctx: LockHookContext, result: { released: boolean }): void | Promise<void>;
  beforeExtend?(ctx: LockHookContext): void | Promise<void>;
  afterExtend?(ctx: LockHookContext, result: { extended: boolean }): void | Promise<void>;
  beforeForceRelease?(ctx: LockHookContext): void | Promise<void>;
  afterForceRelease?(ctx: LockHookContext): void | Promise<void>;
}

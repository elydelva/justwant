/**
 * @justwant/lock — auditLockHooks
 * Convenience factory for audit-style hooks.
 */

import type { LockHookContext, LockHooks } from "./types.js";

export interface AuditLockHooksOptions {
  onAcquire?: (ctx: LockHookContext, result: { acquired: boolean }) => void | Promise<void>;
  onRelease?: (ctx: LockHookContext, result: { released: boolean }) => void | Promise<void>;
  onExtend?: (ctx: LockHookContext, result: { extended: boolean }) => void | Promise<void>;
  onForceRelease?: (ctx: LockHookContext) => void | Promise<void>;
}

export function auditLockHooks(options: AuditLockHooksOptions = {}): LockHooks {
  const { onAcquire, onRelease, onExtend, onForceRelease } = options;
  return {
    ...(onAcquire && {
      afterAcquire: (ctx, result) => onAcquire(ctx, result),
    }),
    ...(onRelease && {
      afterRelease: (ctx, result) => onRelease(ctx, result),
    }),
    ...(onExtend && {
      afterExtend: (ctx, result) => onExtend(ctx, result),
    }),
    ...(onForceRelease && {
      afterForceRelease: (ctx) => onForceRelease(ctx),
    }),
  };
}

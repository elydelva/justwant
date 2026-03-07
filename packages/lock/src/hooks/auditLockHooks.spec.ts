import { describe, expect, test } from "bun:test";
import { auditLockHooks } from "./auditLockHooks.js";

describe("auditLockHooks", () => {
  test("returns LockHooks with afterAcquire when onAcquire provided", () => {
    const calls: unknown[] = [];
    const hooks = auditLockHooks({
      onAcquire: (ctx, result) => {
        calls.push({ op: "acquire", key: ctx.lockable.key, result });
      },
    });
    expect(hooks.afterAcquire).toBeDefined();
    const ctx = {
      owner: { type: "user", id: "u1" },
      lockable: { type: "order", key: "order:1" },
      operation: "acquire" as const,
    };
    hooks.afterAcquire?.(ctx, { acquired: true });
    expect(calls).toEqual([{ op: "acquire", key: "order:1", result: { acquired: true } }]);
  });

  test("returns LockHooks with afterRelease when onRelease provided", () => {
    const calls: unknown[] = [];
    const hooks = auditLockHooks({
      onRelease: (ctx, result) => {
        calls.push({ op: "release", key: ctx.lockable.key, result });
      },
    });
    expect(hooks.afterRelease).toBeDefined();
    const ctx = {
      owner: { type: "user", id: "u1" },
      lockable: { type: "order", key: "order:1" },
      operation: "release" as const,
    };
    hooks.afterRelease?.(ctx, { released: true });
    expect(calls).toEqual([{ op: "release", key: "order:1", result: { released: true } }]);
  });

  test("returns LockHooks with afterForceRelease when onForceRelease provided", () => {
    const calls: unknown[] = [];
    const hooks = auditLockHooks({
      onForceRelease: (ctx) => {
        calls.push({ op: "forceRelease", key: ctx.lockable.key });
      },
    });
    expect(hooks.afterForceRelease).toBeDefined();
    const ctx = {
      owner: { type: "system", id: "force" },
      lockable: { type: "order", key: "order:1" },
      operation: "forceRelease" as const,
    };
    hooks.afterForceRelease?.(ctx);
    expect(calls).toEqual([{ op: "forceRelease", key: "order:1" }]);
  });

  test("returns empty hooks when no options provided", () => {
    const hooks = auditLockHooks();
    expect(hooks.afterAcquire).toBeUndefined();
    expect(hooks.afterRelease).toBeUndefined();
    expect(hooks.afterForceRelease).toBeUndefined();
  });
});

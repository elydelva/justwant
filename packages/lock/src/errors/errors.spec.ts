import { describe, expect, test } from "bun:test";
import {
  LockAlreadyHeldError,
  LockError,
  LockExpiredError,
  LockNotHeldError,
  LockRepositoryError,
  LockableParamsError,
  SemaphoreCapacityExceededError,
} from "./index.js";

describe("errors", () => {
  test("LockError has name and message", () => {
    const err = new LockError("Something went wrong");
    expect(err.name).toBe("LockError");
    expect(err.message).toBe("Something went wrong");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(LockError);
  });

  test("LockNotHeldError extends LockError and exposes lockableKey, ownerType, ownerId", () => {
    const err = new LockNotHeldError("Not held", "key:1", "user", "u1");
    expect(err.name).toBe("LockNotHeldError");
    expect(err.message).toBe("Not held");
    expect(err.lockableKey).toBe("key:1");
    expect(err.ownerType).toBe("user");
    expect(err.ownerId).toBe("u1");
    expect(err).toBeInstanceOf(LockError);
    expect(err).toBeInstanceOf(LockNotHeldError);
  });

  test("LockAlreadyHeldError extends LockError and exposes lockableKey, currentOwnerType, currentOwnerId", () => {
    const err = new LockAlreadyHeldError("Already held", "key:1", "user", "u1");
    expect(err.name).toBe("LockAlreadyHeldError");
    expect(err.lockableKey).toBe("key:1");
    expect(err.currentOwnerType).toBe("user");
    expect(err.currentOwnerId).toBe("u1");
    expect(err).toBeInstanceOf(LockError);
  });

  test("SemaphoreCapacityExceededError extends LockError and exposes requested, available, max", () => {
    const err = new SemaphoreCapacityExceededError("No capacity", "key:1", 5, 2, 10);
    expect(err.name).toBe("SemaphoreCapacityExceededError");
    expect(err.lockableKey).toBe("key:1");
    expect(err.requested).toBe(5);
    expect(err.available).toBe(2);
    expect(err.max).toBe(10);
    expect(err).toBeInstanceOf(LockError);
  });

  test("LockExpiredError extends LockError and exposes lockableKey, expiresAt", () => {
    const expiresAt = new Date();
    const err = new LockExpiredError("Expired", "key:1", expiresAt);
    expect(err.name).toBe("LockExpiredError");
    expect(err.lockableKey).toBe("key:1");
    expect(err.expiresAt).toBe(expiresAt);
    expect(err).toBeInstanceOf(LockError);
  });

  test("LockableParamsError extends LockError and exposes lockableName, reason", () => {
    const err = new LockableParamsError("Invalid params", "order", "plural_without_params");
    expect(err.name).toBe("LockableParamsError");
    expect(err.lockableName).toBe("order");
    expect(err.reason).toBe("plural_without_params");
    expect(err).toBeInstanceOf(LockError);
  });

  test("LockRepositoryError extends LockError and exposes operation, cause", () => {
    const cause = new Error("DB error");
    const err = new LockRepositoryError("Repo failed", "create", cause);
    expect(err.name).toBe("LockRepositoryError");
    expect(err.operation).toBe("create");
    expect(err.cause).toBe(cause);
    expect(err).toBeInstanceOf(LockError);
  });
});

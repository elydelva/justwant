import { describe, expect, test } from "bun:test";
import { CeilingViolationError, PermissionDeniedError, PermissionError } from "./index.js";

describe("errors", () => {
  test("PermissionError has name and message", () => {
    const err = new PermissionError("Something went wrong");
    expect(err.name).toBe("PermissionError");
    expect(err.message).toBe("Something went wrong");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PermissionError);
  });

  test("PermissionDeniedError extends PermissionError and exposes actorId, permission, scopeId", () => {
    const err = new PermissionDeniedError("Access denied", "usr_1", "document:read", "org_1");
    expect(err.name).toBe("PermissionDeniedError");
    expect(err.message).toBe("Access denied");
    expect(err.actorId).toBe("usr_1");
    expect(err.permission).toBe("document:read");
    expect(err.scopeId).toBe("org_1");
    expect(err).toBeInstanceOf(PermissionError);
    expect(err).toBeInstanceOf(PermissionDeniedError);
  });

  test("CeilingViolationError extends PermissionError and exposes requiredRole, actorRole", () => {
    const err = new CeilingViolationError("Ceiling not met", "admin", "member");
    expect(err.name).toBe("CeilingViolationError");
    expect(err.message).toBe("Ceiling not met");
    expect(err.requiredRole).toBe("admin");
    expect(err.actorRole).toBe("member");
    expect(err).toBeInstanceOf(PermissionError);
    expect(err).toBeInstanceOf(CeilingViolationError);
  });
});

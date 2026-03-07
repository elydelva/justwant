import { describe, expect, test } from "bun:test";
import { createLockOwner } from "./createLockOwner.js";

describe("createLockOwner", () => {
  test("owner with id returns LockOwner", () => {
    const system = createLockOwner({ name: "system" });
    const owner = system("sys_1");
    expect(owner.type).toBe("system");
    expect(owner.id).toBe("sys_1");
    expect(owner.orgId).toBeUndefined();
  });

  test("owner with within returns LockOwner with orgId", () => {
    const user = createLockOwner({ name: "user", within: "org" });
    const owner = user("org_1", "user_42");
    expect(owner.type).toBe("user");
    expect(owner.id).toBe("user_42");
    expect(owner.orgId).toBe("org_1");
  });

  test("owner throws when no id provided", () => {
    const system = createLockOwner({ name: "system" });
    expect(() => system()).toThrow(/requires an id/);
  });
});

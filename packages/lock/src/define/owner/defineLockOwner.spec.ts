import { describe, expect, test } from "bun:test";
import { defineLockOwner } from "./defineLockOwner.js";

describe("defineLockOwner", () => {
  test("owner with id returns LockOwner", () => {
    const system = defineLockOwner({ name: "system" });
    const owner = system("sys_1");
    expect(owner.type).toBe("system");
    expect(owner.id).toBe("sys_1");
    expect(owner.within).toBeUndefined();
  });

  test("owner with within returns LockOwner with within", () => {
    const user = defineLockOwner({ name: "user", within: "org" });
    const owner = user("org_1", "user_42");
    expect(owner.type).toBe("user");
    expect(owner.id).toBe("user_42");
    expect(owner.within).toEqual({ type: "org", id: "org_1" });
  });

  test("owner throws when no id provided", () => {
    const system = defineLockOwner({ name: "system" });
    expect(() => system()).toThrow(/requires an id/);
  });
});

import { describe, expect, test } from "bun:test";
import { defineAtomicPermission } from "../permission/defineAtomicPermission.js";
import { defineRole } from "./defineRole.js";

describe("defineRole", () => {
  test("resolved excludes except permissions", () => {
    const docRead = defineAtomicPermission({ action: "document:read" });
    const docWrite = defineAtomicPermission({ action: "document:write" });
    const dangerZone = defineAtomicPermission({ action: "settings:dangerZone" });

    const role = defineRole({
      name: "admin",
      permissions: [docRead, docWrite, dangerZone],
      except: [dangerZone],
    });

    expect(role.resolved.has("document:read")).toBe(true);
    expect(role.resolved.has("document:write")).toBe(true);
    expect(role.resolved.has("settings:dangerZone")).toBe(false);
  });

  test("exposes realm, name, permissions, except", () => {
    const docRead = defineAtomicPermission({ action: "document:read" });
    const docWrite = defineAtomicPermission({ action: "document:write" });
    const orgOwner = defineRole({
      name: "owner",
      permissions: [docRead, docWrite],
      except: [docWrite],
      realm: "org",
    });

    expect(orgOwner.name).toBe("owner");
    expect(orgOwner.permissions).toEqual([docRead, docWrite]);
    expect(orgOwner.except).toEqual([docWrite]);
    expect(orgOwner.realm).toBe("org");
    expect(orgOwner.resolved.has("document:read")).toBe(true);
    expect(orgOwner.resolved.has("document:write")).toBe(false);
  });
});

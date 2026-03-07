import { describe, expect, test } from "bun:test";
import { createAtomicPermission } from "../permission/createAtomicPermission.js";
import { createRole } from "./createRole.js";

describe("createRole", () => {
  test("resolved excludes except permissions", () => {
    const docRead = createAtomicPermission({
      domain: "document",
      action: "read",
    });
    const docWrite = createAtomicPermission({
      domain: "document",
      action: "write",
    });
    const dangerZone = createAtomicPermission({
      domain: "settings",
      action: "dangerZone",
    });

    const role = createRole({
      name: "admin",
      permissions: [docRead, docWrite, dangerZone],
      except: [dangerZone],
    });

    expect(role.resolved.has("document:read")).toBe(true);
    expect(role.resolved.has("document:write")).toBe(true);
    expect(role.resolved.has("settings:dangerZone")).toBe(false);
  });

  test("exposes realm, ceiling, name, permissions, except", () => {
    const docRead = createAtomicPermission({ domain: "document", action: "read" });
    const docWrite = createAtomicPermission({ domain: "document", action: "write" });
    const appAdmin = createRole({ name: "admin", permissions: [docRead], realm: "app" });
    const orgOwner = createRole({
      name: "owner",
      permissions: [docRead, docWrite],
      except: [docWrite],
      ceiling: appAdmin,
      realm: "org",
    });

    expect(orgOwner.name).toBe("owner");
    expect(orgOwner.permissions).toEqual([docRead, docWrite]);
    expect(orgOwner.except).toEqual([docWrite]);
    expect(orgOwner.realm).toBe("org");
    expect(orgOwner.ceiling).toBe(appAdmin);
    expect(orgOwner.resolved.has("document:read")).toBe(true);
    expect(orgOwner.resolved.has("document:write")).toBe(false);
  });
});

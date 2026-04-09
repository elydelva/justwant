import { describe, expect, test } from "bun:test";
import { defineResource } from "@justwant/resource";
import { defineActor } from "../actor/defineActor.js";
import { defineAtomicPermission } from "../permission/defineAtomicPermission.js";
import { defineRole } from "../role/defineRole.js";
import { defineScope } from "../scope/defineScope.js";
import { defineRealm } from "./defineRealm.js";

describe("defineRealm", () => {
  test("composes scope, actors, resources, permissions, roles", () => {
    const appScope = defineScope({ name: "app" });
    const userActor = defineActor({ name: "user" });
    const documentResource = defineResource({ name: "document" });
    const documentRead = defineAtomicPermission({ action: "document:read" });
    const member = defineRole({
      name: "member",
      permissions: [documentRead],
      realm: "app",
    });

    const realm = defineRealm({
      name: "app",
      scope: appScope,
      actors: [userActor],
      resources: [documentResource],
      permissions: [documentRead],
      roles: [member],
    });

    expect(realm.name).toBe("app");
    expect(realm.scope).toBe(appScope);
    expect(realm.actors).toContain(userActor);
    expect(realm.resources).toContain(documentResource);
    expect(realm.permissions).toContain(documentRead);
    expect(realm.roles).toContain(member);
  });

  test("roleByName maps role names to role defs", () => {
    const appScope = defineScope({ name: "app" });
    const userActor = defineActor({ name: "user" });
    const documentRead = defineAtomicPermission({ action: "document:read" });
    const member = defineRole({ name: "member", permissions: [documentRead], realm: "app" });
    const admin = defineRole({ name: "admin", permissions: [documentRead], realm: "app" });

    const realm = defineRealm({
      name: "app",
      scope: appScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [member, admin],
    });

    expect(realm.roleByName.get("member")).toBe(member);
    expect(realm.roleByName.get("admin")).toBe(admin);
  });

  test("permissionById maps permission ids to atomic permissions", () => {
    const appScope = defineScope({ name: "app" });
    const userActor = defineActor({ name: "user" });
    const documentRead = defineAtomicPermission({ action: "document:read" });
    const documentWrite = defineAtomicPermission({ action: "document:write" });
    const member = defineRole({
      name: "member",
      permissions: [documentRead, documentWrite],
      realm: "app",
    });

    const realm = defineRealm({
      name: "app",
      scope: appScope,
      actors: [userActor],
      permissions: [documentRead, documentWrite],
      roles: [member],
    });

    expect(realm.permissionById.get("document:read")).toBe(documentRead);
    expect(realm.permissionById.get("document:write")).toBe(documentWrite);
  });

  test("defaults resources to empty array when omitted", () => {
    const appScope = defineScope({ name: "app" });
    const userActor = defineActor({ name: "user" });
    const documentRead = defineAtomicPermission({ action: "document:read" });
    const member = defineRole({ name: "member", permissions: [documentRead], realm: "app" });

    const realm = defineRealm({
      name: "app",
      scope: appScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [member],
    });

    expect(realm.resources).toEqual([]);
  });
});

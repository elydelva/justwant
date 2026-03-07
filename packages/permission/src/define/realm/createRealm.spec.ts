import { describe, expect, test } from "bun:test";
import { createActor } from "../actor/createActor.js";
import { createAtomicPermission } from "../permission/createAtomicPermission.js";
import { createResource } from "../resource/createResource.js";
import { createRole } from "../role/createRole.js";
import { createScope } from "../scope/createScope.js";
import { createRealm } from "./createRealm.js";

describe("createRealm", () => {
  test("composes scope, actors, resources, permissions, roles", () => {
    const appScope = createScope({ name: "app" });
    const userActor = createActor({ name: "user" });
    const documentResource = createResource({ name: "document" });
    const documentRead = createAtomicPermission({
      domain: "document",
      action: "read",
    });
    const member = createRole({
      name: "member",
      permissions: [documentRead],
      realm: "app",
    });

    const realm = createRealm({
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
    const appScope = createScope({ name: "app" });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const member = createRole({ name: "member", permissions: [documentRead], realm: "app" });
    const admin = createRole({ name: "admin", permissions: [documentRead], realm: "app" });

    const realm = createRealm({
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
    const appScope = createScope({ name: "app" });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const documentWrite = createAtomicPermission({ domain: "document", action: "write" });
    const member = createRole({
      name: "member",
      permissions: [documentRead, documentWrite],
      realm: "app",
    });

    const realm = createRealm({
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
    const appScope = createScope({ name: "app" });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const member = createRole({ name: "member", permissions: [documentRead], realm: "app" });

    const realm = createRealm({
      name: "app",
      scope: appScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [member],
    });

    expect(realm.resources).toEqual([]);
  });
});

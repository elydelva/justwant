import { describe, expect, test } from "bun:test";
import {
  CeilingViolationError,
  PermissionDeniedError,
  createActor,
  createAtomicPermission,
  createPermission,
  createRealm,
  createResource,
  createRole,
  createScope,
} from "./index.js";
import type { Assignment, Override } from "./types/index.js";

function createMemoryRepo<T extends { id: string }>() {
  const store = new Map<string, T>();
  let nextId = 1;

  return {
    async findById(id: string): Promise<T | null> {
      return store.get(id) ?? null;
    },
    async findOne(where: Partial<T>): Promise<T | null> {
      for (const item of store.values()) {
        let match = true;
        for (const [k, v] of Object.entries(where)) {
          if (v !== undefined && (item as Record<string, unknown>)[k] !== v) {
            match = false;
            break;
          }
        }
        if (match) return item;
      }
      return null;
    },
    async findMany(where: Partial<T>): Promise<T[]> {
      const result: T[] = [];
      for (const item of store.values()) {
        let match = true;
        for (const [k, v] of Object.entries(where)) {
          if (v !== undefined && (item as Record<string, unknown>)[k] !== v) {
            match = false;
            break;
          }
        }
        if (match) result.push(item);
      }
      return result;
    },
    async create(data: Omit<T, "id">): Promise<T> {
      const id = `id_${nextId++}`;
      const item = { ...data, id } as T;
      store.set(id, item);
      return item;
    },
    async update(id: string, data: Partial<T>): Promise<T> {
      const existing = store.get(id);
      if (!existing) throw new Error("Not found");
      const updated = { ...existing, ...data } as T;
      store.set(id, updated);
      return updated;
    },
    async delete(id: string): Promise<void> {
      store.delete(id);
    },
  };
}

describe("createPermission", () => {
  test("can, assign, hasRole, unassign", async () => {
    const appScope = createScope({ name: "app", singular: true });
    const orgScope = createScope({ name: "org", singular: false });

    const userActor = createActor({ name: "user" });

    const documentRead = createAtomicPermission({
      domain: "document",
      action: "read",
    });
    const documentWrite = createAtomicPermission({
      domain: "document",
      action: "write",
    });

    const appMember = createRole({
      name: "member",
      permissions: [documentRead, documentWrite],
      realm: "app",
    });
    const orgAdmin = createRole({
      name: "admin",
      permissions: [documentRead, documentWrite],
      ceiling: appMember,
    });
    const orgViewer = createRole({
      name: "viewer",
      permissions: [documentRead],
      ceiling: appMember,
    });

    const appRealm = createRealm({
      name: "app",
      scope: appScope,
      actors: [userActor],
      permissions: [documentRead, documentWrite],
      roles: [appMember],
    });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead, documentWrite],
      roles: [orgAdmin, orgViewer],
    });

    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();

    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { app: appRealm, org: orgRealm },
    });

    const user1 = userActor("usr_1");
    const orgId = "org_1";

    await perm.assign(user1, appMember, appScope());
    await perm.assign(user1, orgAdmin, orgScope(orgId));

    expect(await perm.can(user1, documentRead, orgScope(orgId))).toBe(true);
    expect(await perm.can(user1, documentWrite, orgScope(orgId))).toBe(true);
    expect(await perm.hasRole(user1, orgAdmin, orgScope(orgId))).toBe(true);

    await perm.unassign(user1, orgScope(orgId));
    expect(await perm.hasRole(user1, orgAdmin, orgScope(orgId))).toBe(false);
    expect(await perm.can(user1, documentRead, orgScope(orgId))).toBe(false);
  });

  test("grant and deny overrides", async () => {
    const appScope = createScope({ name: "app", singular: true });
    const orgScope = createScope({ name: "org", singular: false });

    const userActor = createActor({ name: "user" });
    const documentResource = createResource({ name: "document" });
    const documentRead = createAtomicPermission({
      domain: "document",
      action: "read",
      resource: documentResource,
    });

    const orgViewer = createRole({
      name: "viewer",
      permissions: [documentRead],
      realm: "org",
    });

    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      resources: [documentResource],
      permissions: [documentRead],
      roles: [orgViewer],
    });

    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();

    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");
    const orgId = "org_1";

    await perm.assign(user1, orgViewer, orgScope(orgId));

    await perm.grant(user1, documentRead, orgScope(orgId), documentResource("doc_1"));

    expect(await perm.can(user1, documentRead, orgScope(orgId), documentResource("doc_1"))).toBe(
      true
    );

    await perm.deny(user1, documentRead, orgScope(orgId), documentResource("doc_1"));

    expect(await perm.can(user1, documentRead, orgScope(orgId), documentResource("doc_1"))).toBe(
      false
    );
  });

  test("ceiling blocks assign when parent role missing", async () => {
    const appScope = createScope({ name: "app", singular: true });
    const orgScope = createScope({ name: "org", singular: false });

    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({
      domain: "document",
      action: "read",
    });

    const appAdmin = createRole({
      name: "admin",
      permissions: [documentRead],
      realm: "app",
    });
    const orgOwner = createRole({
      name: "owner",
      permissions: [documentRead],
      ceiling: appAdmin,
    });

    const appRealm = createRealm({
      name: "app",
      scope: appScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [appAdmin],
    });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [orgOwner],
    });

    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();

    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { app: appRealm, org: orgRealm },
    });

    const user1 = userActor("usr_1");
    const orgId = "org_1";

    await expect(perm.assign(user1, orgOwner, orgScope(orgId))).rejects.toThrow(
      CeilingViolationError
    );

    await perm.assign(user1, appAdmin, appScope());
    await perm.assign(user1, orgOwner, orgScope(orgId));

    expect(await perm.can(user1, documentRead, orgScope(orgId))).toBe(true);
  });

  test("explain returns result and reason", async () => {
    const appScope = createScope({ name: "app", singular: true });
    const orgScope = createScope({ name: "org", singular: false });

    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({
      domain: "document",
      action: "read",
    });
    const orgAdmin = createRole({
      name: "admin",
      permissions: [documentRead],
      realm: "org",
    });

    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [orgAdmin],
    });

    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();

    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");
    const orgId = "org_1";

    const beforeAssign = await perm.explain(user1, documentRead, orgScope(orgId));
    expect(beforeAssign.result).toBe(false);
    expect(beforeAssign.reason).toBe("no_assignment");

    await perm.assign(user1, orgAdmin, orgScope(orgId));

    const afterAssign = await perm.explain(user1, documentRead, orgScope(orgId));
    expect(afterAssign.result).toBe(true);
    expect(afterAssign.reason).toBe("role");
    expect(afterAssign.role).toBe("admin");
  });

  test("assert throws PermissionDeniedError when can returns false", async () => {
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const orgAdmin = createRole({ name: "admin", permissions: [documentRead], realm: "org" });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [orgAdmin],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");

    await expect(perm.assert(user1, documentRead, orgScope("org_1"))).rejects.toThrow(
      PermissionDeniedError
    );

    await perm.assign(user1, orgAdmin, orgScope("org_1"));
    await expect(perm.assert(user1, documentRead, orgScope("org_1"))).resolves.toBeUndefined();
  });

  test("revokeGrant and revokeDeny remove overrides", async () => {
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentResource = createResource({ name: "document" });
    const documentRead = createAtomicPermission({
      domain: "document",
      action: "read",
      resource: documentResource,
    });
    const orgViewer = createRole({ name: "viewer", permissions: [documentRead], realm: "org" });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      resources: [documentResource],
      permissions: [documentRead],
      roles: [orgViewer],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");

    await perm.grant(user1, documentRead, orgScope("org_1"), documentResource("doc_1"));
    expect(await perm.can(user1, documentRead, orgScope("org_1"), documentResource("doc_1"))).toBe(
      true
    );

    await perm.revokeGrant(user1, documentRead, orgScope("org_1"), documentResource("doc_1"));
    expect(await perm.can(user1, documentRead, orgScope("org_1"), documentResource("doc_1"))).toBe(
      false
    );

    await perm.assign(user1, orgViewer, orgScope("org_1"));
    await perm.deny(user1, documentRead, orgScope("org_1"), documentResource("doc_1"));
    expect(await perm.can(user1, documentRead, orgScope("org_1"), documentResource("doc_1"))).toBe(
      false
    );

    await perm.revokeDeny(user1, documentRead, orgScope("org_1"), documentResource("doc_1"));
    expect(await perm.can(user1, documentRead, orgScope("org_1"), documentResource("doc_1"))).toBe(
      true
    );
  });

  test("canAll returns true only when all actions allowed", async () => {
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const documentWrite = createAtomicPermission({ domain: "document", action: "write" });
    const orgAdmin = createRole({
      name: "admin",
      permissions: [documentRead, documentWrite],
      realm: "org",
    });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead, documentWrite],
      roles: [orgAdmin],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");

    expect(await perm.canAll(user1, [documentRead, documentWrite], orgScope("org_1"))).toBe(false);

    await perm.assign(user1, orgAdmin, orgScope("org_1"));
    expect(await perm.canAll(user1, [documentRead, documentWrite], orgScope("org_1"))).toBe(true);
    expect(await perm.canAll(user1, [documentRead, documentWrite], orgScope("org_2"))).toBe(false);
  });

  test("canAny returns true when at least one action allowed", async () => {
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const documentWrite = createAtomicPermission({ domain: "document", action: "write" });
    const orgViewer = createRole({ name: "viewer", permissions: [documentRead], realm: "org" });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead, documentWrite],
      roles: [orgViewer],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");

    await perm.assign(user1, orgViewer, orgScope("org_1"));

    expect(await perm.canAny(user1, [documentRead, documentWrite], orgScope("org_1"))).toBe(true);
    expect(await perm.canAny(user1, [documentWrite], orgScope("org_1"))).toBe(false);
  });

  test("canMany returns map of actor id to allowed", async () => {
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const orgAdmin = createRole({ name: "admin", permissions: [documentRead], realm: "org" });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [orgAdmin],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");
    const user2 = userActor("usr_2");

    await perm.assign(user1, orgAdmin, orgScope("org_1"));

    const result = await perm.canMany([user1, user2], documentRead, orgScope("org_1"));
    expect(result.get("usr_1")).toBe(true);
    expect(result.get("usr_2")).toBe(false);
  });

  test("revokeScope removes all assignments and overrides for scope", async () => {
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const orgAdmin = createRole({ name: "admin", permissions: [documentRead], realm: "org" });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [orgAdmin],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");
    const user2 = userActor("usr_2");

    await perm.assign(user1, orgAdmin, orgScope("org_1"));
    await perm.assign(user2, orgAdmin, orgScope("org_1"));
    await perm.assign(user1, orgAdmin, orgScope("org_2"));

    await perm.revokeScope(orgScope("org_1"));

    expect(await perm.hasRole(user1, orgAdmin, orgScope("org_1"))).toBe(false);
    expect(await perm.hasRole(user2, orgAdmin, orgScope("org_1"))).toBe(false);
    expect(await perm.hasRole(user1, orgAdmin, orgScope("org_2"))).toBe(true);
  });

  test("revokeAll removes all assignments and overrides for actor", async () => {
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const orgAdmin = createRole({ name: "admin", permissions: [documentRead], realm: "org" });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [orgAdmin],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");

    await perm.assign(user1, orgAdmin, orgScope("org_1"));
    await perm.assign(user1, orgAdmin, orgScope("org_2"));

    await perm.revokeAll(user1);

    expect(await perm.hasRole(user1, orgAdmin, orgScope("org_1"))).toBe(false);
    expect(await perm.hasRole(user1, orgAdmin, orgScope("org_2"))).toBe(false);
  });

  test("realm returns realm by name", () => {
    const appScope = createScope({ name: "app", singular: true });
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const appRealm = createRealm({
      name: "app",
      scope: appScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [],
    });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { app: appRealm, org: orgRealm },
    });

    expect(perm.realm("app")).toBe(appRealm);
    expect(perm.realm("org")).toBe(orgRealm);
    expect(perm.realm("unknown")).toBeUndefined();
  });

  test("assign throws when scope type unknown", async () => {
    const appScope = createScope({ name: "app", singular: true });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const orgAdmin = createRole({ name: "admin", permissions: [documentRead], realm: "org" });
    const unknownScope = createScope({ name: "unknown", singular: false });
    const appRealm = createRealm({
      name: "app",
      scope: appScope,
      actors: [userActor],
      permissions: [documentRead],
      roles: [orgAdmin],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { app: appRealm },
    });

    const user1 = userActor("usr_1");

    await expect(perm.assign(user1, orgAdmin, unknownScope("x"))).rejects.toThrow(
      /Unknown scope type: unknown/
    );
  });

  test("explain returns deny reason when override denies", async () => {
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentResource = createResource({ name: "document" });
    const documentRead = createAtomicPermission({
      domain: "document",
      action: "read",
      resource: documentResource,
    });
    const orgViewer = createRole({ name: "viewer", permissions: [documentRead], realm: "org" });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      resources: [documentResource],
      permissions: [documentRead],
      roles: [orgViewer],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");

    await perm.assign(user1, orgViewer, orgScope("org_1"));
    await perm.deny(user1, documentRead, orgScope("org_1"), documentResource("doc_1"));

    const explained = await perm.explain(
      user1,
      documentRead,
      orgScope("org_1"),
      documentResource("doc_1")
    );
    expect(explained.result).toBe(false);
    expect(explained.reason).toBe("deny");
  });

  test("explain returns grant reason when override grants", async () => {
    const orgScope = createScope({ name: "org", singular: false });
    const userActor = createActor({ name: "user" });
    const documentResource = createResource({ name: "document" });
    const documentRead = createAtomicPermission({
      domain: "document",
      action: "read",
      resource: documentResource,
    });
    const orgRealm = createRealm({
      name: "org",
      scope: orgScope,
      actors: [userActor],
      resources: [documentResource],
      permissions: [documentRead],
      roles: [],
    });
    const assignments = createMemoryRepo<Assignment>();
    const overrides = createMemoryRepo<Override>();
    const perm = createPermission({
      repos: { assignments, overrides },
      realms: { org: orgRealm },
    });

    const user1 = userActor("usr_1");

    await perm.grant(user1, documentRead, orgScope("org_1"), documentResource("doc_1"));

    const explained = await perm.explain(
      user1,
      documentRead,
      orgScope("org_1"),
      documentResource("doc_1")
    );
    expect(explained.result).toBe(true);
    expect(explained.reason).toBe("grant");
  });
});

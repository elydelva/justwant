import { describe, expect, test } from "bun:test";
import {
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
    const appScope = createScope({ name: "app" });
    const orgScope = createScope({ name: "org" });

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
      realm: "org",
    });
    const orgViewer = createRole({
      name: "viewer",
      permissions: [documentRead],
      realm: "org",
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

    await perm.assign({ actor: user1, role: appMember, scope: appScope() });
    await perm.assign({ actor: user1, role: orgAdmin, scope: orgScope("org_1") });

    expect(await perm.can({ actor: user1, action: documentRead, scope: orgScope("org_1") })).toBe(
      true
    );
    expect(await perm.can({ actor: user1, action: documentWrite, scope: orgScope("org_1") })).toBe(
      true
    );
    expect(await perm.hasRole({ actor: user1, role: orgAdmin, scope: orgScope("org_1") })).toBe(
      true
    );

    await perm.unassign({ actor: user1, scope: orgScope("org_1") });
    expect(await perm.hasRole({ actor: user1, role: orgAdmin, scope: orgScope("org_1") })).toBe(
      false
    );
    expect(await perm.can({ actor: user1, action: documentRead, scope: orgScope("org_1") })).toBe(
      false
    );
  });

  test("grant and deny overrides", async () => {
    const orgScope = createScope({ name: "org" });

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

    await perm.assign({ actor: user1, role: orgViewer, scope: orgScope("org_1") });

    await perm.grant({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });

    expect(
      await perm.can({
        actor: user1,
        action: documentRead,
        scope: orgScope("org_1"),
        resource: documentResource("doc_1"),
      })
    ).toBe(true);

    await perm.deny({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });

    expect(
      await perm.can({
        actor: user1,
        action: documentRead,
        scope: orgScope("org_1"),
        resource: documentResource("doc_1"),
      })
    ).toBe(false);
  });

  test("explain returns result and reason", async () => {
    const orgScope = createScope({ name: "org" });

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

    const beforeAssign = await perm.explain({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
    });
    expect(beforeAssign.result).toBe(false);
    expect(beforeAssign.reason).toBe("no_assignment");

    await perm.assign({ actor: user1, role: orgAdmin, scope: orgScope("org_1") });

    const afterAssign = await perm.explain({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
    });
    expect(afterAssign.result).toBe(true);
    expect(afterAssign.reason).toBe("role");
    expect(afterAssign.role).toBe("admin");
  });

  test("assert throws PermissionDeniedError when can returns false", async () => {
    const orgScope = createScope({ name: "org" });
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

    await expect(
      perm.assert({ actor: user1, action: documentRead, scope: orgScope("org_1") })
    ).rejects.toThrow(PermissionDeniedError);

    await perm.assign({ actor: user1, role: orgAdmin, scope: orgScope("org_1") });
    await expect(
      perm.assert({ actor: user1, action: documentRead, scope: orgScope("org_1") })
    ).resolves.toBeUndefined();
  });

  test("revokeGrant and revokeDeny remove overrides", async () => {
    const orgScope = createScope({ name: "org" });
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

    await perm.grant({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });
    expect(
      await perm.can({
        actor: user1,
        action: documentRead,
        scope: orgScope("org_1"),
        resource: documentResource("doc_1"),
      })
    ).toBe(true);

    await perm.revokeGrant({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });
    expect(
      await perm.can({
        actor: user1,
        action: documentRead,
        scope: orgScope("org_1"),
        resource: documentResource("doc_1"),
      })
    ).toBe(false);

    await perm.assign({ actor: user1, role: orgViewer, scope: orgScope("org_1") });
    await perm.deny({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });
    expect(
      await perm.can({
        actor: user1,
        action: documentRead,
        scope: orgScope("org_1"),
        resource: documentResource("doc_1"),
      })
    ).toBe(false);

    await perm.revokeDeny({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });
    expect(
      await perm.can({
        actor: user1,
        action: documentRead,
        scope: orgScope("org_1"),
        resource: documentResource("doc_1"),
      })
    ).toBe(true);
  });

  test("canAll returns true only when all actions allowed", async () => {
    const orgScope = createScope({ name: "org" });
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

    expect(
      await perm.canAll({
        actor: user1,
        actions: [documentRead, documentWrite],
        scope: orgScope("org_1"),
      })
    ).toBe(false);

    await perm.assign({ actor: user1, role: orgAdmin, scope: orgScope("org_1") });
    expect(
      await perm.canAll({
        actor: user1,
        actions: [documentRead, documentWrite],
        scope: orgScope("org_1"),
      })
    ).toBe(true);
    expect(
      await perm.canAll({
        actor: user1,
        actions: [documentRead, documentWrite],
        scope: orgScope("org_2"),
      })
    ).toBe(false);
  });

  test("canAny returns true when at least one action allowed", async () => {
    const orgScope = createScope({ name: "org" });
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

    await perm.assign({ actor: user1, role: orgViewer, scope: orgScope("org_1") });

    expect(
      await perm.canAny({
        actor: user1,
        actions: [documentRead, documentWrite],
        scope: orgScope("org_1"),
      })
    ).toBe(true);
    expect(
      await perm.canAny({
        actor: user1,
        actions: [documentWrite],
        scope: orgScope("org_1"),
      })
    ).toBe(false);
  });

  test("canMany returns map of actor id to allowed", async () => {
    const orgScope = createScope({ name: "org" });
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

    await perm.assign({ actor: user1, role: orgAdmin, scope: orgScope("org_1") });

    const result = await perm.canMany({
      actors: [user1, user2],
      action: documentRead,
      scope: orgScope("org_1"),
    });
    expect(result.get("usr_1")).toBe(true);
    expect(result.get("usr_2")).toBe(false);
  });

  test("revokeScope removes all assignments and overrides for scope", async () => {
    const orgScope = createScope({ name: "org" });
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

    await perm.assign({ actor: user1, role: orgAdmin, scope: orgScope("org_1") });
    await perm.assign({ actor: user2, role: orgAdmin, scope: orgScope("org_1") });
    await perm.assign({ actor: user1, role: orgAdmin, scope: orgScope("org_2") });

    await perm.revokeScope({ scope: orgScope("org_1") });

    expect(await perm.hasRole({ actor: user1, role: orgAdmin, scope: orgScope("org_1") })).toBe(
      false
    );
    expect(await perm.hasRole({ actor: user2, role: orgAdmin, scope: orgScope("org_1") })).toBe(
      false
    );
    expect(await perm.hasRole({ actor: user1, role: orgAdmin, scope: orgScope("org_2") })).toBe(
      true
    );
  });

  test("revokeAll removes all assignments and overrides for actor", async () => {
    const orgScope = createScope({ name: "org" });
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

    await perm.assign({ actor: user1, role: orgAdmin, scope: orgScope("org_1") });
    await perm.assign({ actor: user1, role: orgAdmin, scope: orgScope("org_2") });

    await perm.revokeAll({ actor: user1 });

    expect(await perm.hasRole({ actor: user1, role: orgAdmin, scope: orgScope("org_1") })).toBe(
      false
    );
    expect(await perm.hasRole({ actor: user1, role: orgAdmin, scope: orgScope("org_2") })).toBe(
      false
    );
  });

  test("realm returns realm by name", () => {
    const appScope = createScope({ name: "app" });
    const orgScope = createScope({ name: "org" });
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

    expect(perm.realm({ name: "app" })).toBe(appRealm);
    expect(perm.realm({ name: "org" })).toBe(orgRealm);
    expect(perm.realm({ name: "unknown" })).toBeUndefined();
  });

  test("assign throws when scope type unknown", async () => {
    const appScope = createScope({ name: "app" });
    const userActor = createActor({ name: "user" });
    const documentRead = createAtomicPermission({ domain: "document", action: "read" });
    const orgAdmin = createRole({ name: "admin", permissions: [documentRead], realm: "org" });
    const unknownScope = createScope({ name: "unknown" });
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

    await expect(
      perm.assign({ actor: user1, role: orgAdmin, scope: unknownScope("x") })
    ).rejects.toThrow(/Unknown scope type: unknown/);
  });

  test("explain returns deny reason when override denies", async () => {
    const orgScope = createScope({ name: "org" });
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

    await perm.assign({ actor: user1, role: orgViewer, scope: orgScope("org_1") });
    await perm.deny({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });

    const explained = await perm.explain({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });
    expect(explained.result).toBe(false);
    expect(explained.reason).toBe("deny");
  });

  test("explain returns grant reason when override grants", async () => {
    const orgScope = createScope({ name: "org" });
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

    await perm.grant({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });

    const explained = await perm.explain({
      actor: user1,
      action: documentRead,
      scope: orgScope("org_1"),
      resource: documentResource("doc_1"),
    });
    expect(explained.result).toBe(true);
    expect(explained.reason).toBe("grant");
  });
});

import { describe, expect, test } from "bun:test";
import { createMembershipService } from "@justwant/membership";
import { defineGroup, defineMember } from "@justwant/membership";
import type { Membership, MembershipsRepo } from "@justwant/membership";
import {
  createPermissionService,
  defineActor,
  defineAtomicPermission,
  defineRealm,
  defineRole,
  defineScope,
} from "@justwant/permission";
import type { Assignment, Override } from "@justwant/permission";
import { PermissionDeniedError } from "@justwant/permission";
import { createStandardOrganisationMembership } from "./createStandardOrganisationMembership.js";
import { createStandardOrganisationPermission } from "./createStandardOrganisationPermission.js";
import { DuplicateSlugError } from "./errors/DuplicateSlugError.js";
import { OrganisationNotFoundError } from "./errors/OrganisationNotFoundError.js";
import { createOrganisationService, defineOrganisation } from "./index.js";
import { OrganisationGroup } from "./membership/index.js";
import { OrganisationPermissions, OrganisationRealm } from "./permissions/index.js";
import type { Organisation, OrganisationsRepo } from "./types/index.js";

const member = defineMember({ name: "user" });
const actor = defineActor({ name: "user" });
const { group } = createStandardOrganisationMembership({ name: "organisation", member });
const { realm } = createStandardOrganisationPermission({ name: "organisation", actor });
const OrganisationOrg = defineOrganisation({ name: "organisation", realm, group });

function createMockOrganisationsRepo(initial: Organisation[] = []): OrganisationsRepo {
  const store = new Map<string, Organisation>(initial.map((o) => [o.id, { ...o }]));

  return {
    async findById(id) {
      return store.get(id) ?? null;
    },
    async findOne(where) {
      for (const o of store.values()) {
        if (where.id !== undefined && o.id !== where.id) continue;
        if (where.type !== undefined && o.type !== where.type) continue;
        if (where.slug !== undefined && o.slug !== where.slug) continue;
        return o;
      }
      return null;
    },
    async findMany(where) {
      return [...store.values()].filter((o) => {
        if (where.id !== undefined && o.id !== where.id) return false;
        if (where.type !== undefined && o.type !== where.type) return false;
        if (where.slug !== undefined && o.slug !== where.slug) return false;
        return true;
      });
    },
    async create(data) {
      const id = `org_${store.size + 1}`;
      const org: Organisation = {
        id,
        type: data.type,
        name: data.name,
        slug: data.slug,
      };
      store.set(id, org);
      return org;
    },
    async update(id, data) {
      const existing = store.get(id);
      if (!existing) throw new Error("not found");
      const updated = { ...existing, ...data };
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      store.delete(id);
    },
  };
}

function createMemoryRepo<T extends { id: string }>() {
  const store = new Map<string, T>();
  let nextId = 1;

  return {
    async findById(id: string) {
      return store.get(id) ?? null;
    },
    async findOne(where: Partial<T>) {
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
    async findMany(where: Partial<T>) {
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
    async create(data: Omit<T, "id">) {
      const id = `id_${nextId++}`;
      const item = { ...data, id } as T;
      store.set(id, item);
      return item;
    },
    async update(id: string, data: Partial<T>) {
      const existing = store.get(id);
      if (!existing) throw new Error("Not found");
      const updated = { ...existing, ...data } as T;
      store.set(id, updated);
      return updated;
    },
    async delete(id: string) {
      store.delete(id);
    },
  };
}

describe("createOrganisationService", () => {
  test("create adds organisation", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
    expect(acme.name).toBe("Acme");
    expect(acme.slug).toBe("acme");
    expect(acme.type).toBe("organisation");
    expect(acme.id).toBeDefined();

    const found = await org.findById(acme.id);
    expect(found).toEqual(acme);
  });

  test("findBySlug returns organisation when exists", async () => {
    const orgRepo = createMockOrganisationsRepo([
      { id: "org_1", type: "organisation", name: "Acme", slug: "acme" },
    ]);
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const found = await org.findBySlug("acme");
    expect(found?.name).toBe("Acme");
  });

  test("create throws DuplicateSlugError when slug exists", async () => {
    const orgRepo = createMockOrganisationsRepo([
      { id: "org_1", type: "organisation", name: "Acme", slug: "acme" },
    ]);
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    await expect(org.create({ name: "Other", slug: "acme", type: "organisation" })).rejects.toThrow(
      DuplicateSlugError
    );
  });

  test("update throws OrganisationNotFoundError when not found", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    await expect(org.update({ id: "org_99", data: { name: "X" } })).rejects.toThrow(
      OrganisationNotFoundError
    );
  });

  test("delete throws OrganisationNotFoundError when not found", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    await expect(org.delete({ id: "org_99" })).rejects.toThrow(OrganisationNotFoundError);
  });

  test("addMember and listMembers work", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
    await org.addMember({
      organisation: acme,
      member: { id: "usr_1" },
      role: "owner",
    });

    const members = await org.listMembers({ organisation: acme });
    expect(members).toHaveLength(1);
    expect(members[0]).toEqual({ type: "user", id: "usr_1" });
  });

  test("listForMember returns organisations for member", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
    await org.addMember({
      organisation: acme,
      member: { id: "usr_1" },
      role: "member",
    });

    const orgs = await org.listForMember({ member: { id: "usr_1" } });
    expect(orgs).toHaveLength(1);
    expect(orgs[0].name).toBe("Acme");
  });

  test("removeMember removes member from organisation", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
    await org.addMember({
      organisation: acme,
      member: { id: "usr_1" },
      role: "member",
    });

    await org.removeMember({ organisation: acme, member: { id: "usr_1" } });

    const members = await org.listMembers({ organisation: acme });
    expect(members).toHaveLength(0);
  });

  test("assignRole assigns role to member", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
    await org.addMember({
      organisation: acme,
      member: { id: "usr_1" },
      role: "viewer",
    });

    await org.assignRole({
      organisation: acme,
      member: { id: "usr_1" },
      role: "admin",
    });

    const canInvite = await org.can({
      organisation: acme,
      member: { id: "usr_1" },
      permission: OrganisationPermissions.memberInvite,
    });
    expect(canInvite).toBe(true);
  });

  test("can returns true when member has permission", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
    await org.addMember({
      organisation: acme,
      member: { id: "usr_1" },
      role: "owner",
    });

    const canDelete = await org.can({
      organisation: acme,
      member: { id: "usr_1" },
      permission: OrganisationPermissions.organisationDelete,
    });
    expect(canDelete).toBe(true);
  });

  test("create throws when type is missing", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    await expect(
      org.create({ name: "Acme", slug: "acme" } as { name: string; slug: string })
    ).rejects.toThrow("Organisation type is required");
  });

  test("create throws when type is unknown", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    await expect(org.create({ name: "Acme", slug: "acme", type: "unknown-type" })).rejects.toThrow(
      "Unknown organisation type: unknown-type"
    );
  });

  test("update throws PermissionDeniedError when member lacks permission", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
    await org.addMember({
      organisation: acme,
      member: { id: "usr_viewer" },
      role: "viewer",
    });

    await expect(
      org.update({
        id: acme.id,
        data: { name: "Acme Updated" },
        member: { id: "usr_viewer" },
      })
    ).rejects.toThrow(PermissionDeniedError);
  });

  test("update throws DuplicateSlugError when new slug already exists", async () => {
    const orgRepo = createMockOrganisationsRepo([
      { id: "org_1", type: "organisation", name: "Acme", slug: "acme" },
      { id: "org_2", type: "organisation", name: "Other", slug: "other" },
    ]);
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    await expect(
      org.update({
        id: "org_2",
        data: { slug: "acme" },
      })
    ).rejects.toThrow(DuplicateSlugError);
  });

  test("delete throws PermissionDeniedError when member lacks permission", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
    await org.addMember({
      organisation: acme,
      member: { id: "usr_viewer" },
      role: "viewer",
    });

    await expect(org.delete({ id: acme.id, member: { id: "usr_viewer" } })).rejects.toThrow(
      PermissionDeniedError
    );
  });

  test("assignRole throws when role is unknown", async () => {
    const orgRepo = createMockOrganisationsRepo();
    const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
    const assignmentsRepo = createMemoryRepo<Assignment>();
    const overridesRepo = createMemoryRepo<Override>();

    const membership = createMembershipService({
      repo: membershipsRepo,
      groups: [OrganisationGroup],
    });

    const permission = createPermissionService({
      repos: { assignments: assignmentsRepo, overrides: overridesRepo },
      realms: [OrganisationRealm],
    });

    const org = createOrganisationService({
      repo: orgRepo,
      deps: { membership, permission },
      organisations: [OrganisationOrg],
    });

    const acme = await org.create({ name: "Acme", slug: "acme", type: "organisation" });
    await org.addMember({
      organisation: acme,
      member: { id: "usr_1" },
      role: "member",
    });

    await expect(
      org.assignRole({
        organisation: acme,
        member: { id: "usr_1" },
        role: "superadmin",
      })
    ).rejects.toThrow("Unknown role: superadmin");
  });

  describe("multi-type E2E (tenant + workspace)", () => {
    test("same user in tenant and workspace, listForMember returns both with correct types", async () => {
      const userMember = defineMember({ name: "user" });
      const userActor = defineActor({ name: "user" });

      const tenantMembership = createStandardOrganisationMembership({
        name: "tenant",
        member: userMember,
      });
      const tenantPermission = createStandardOrganisationPermission({
        name: "tenant",
        actor: userActor,
      });
      const TenantOrg = defineOrganisation({
        name: "tenant",
        realm: tenantPermission.realm,
        group: tenantMembership.group,
      });

      const workspaceMembership = createStandardOrganisationMembership({
        name: "workspace",
        member: userMember,
      });
      const workspacePermission = createStandardOrganisationPermission({
        name: "workspace",
        actor: userActor,
      });
      const WorkspaceOrg = defineOrganisation({
        name: "workspace",
        realm: workspacePermission.realm,
        group: workspaceMembership.group,
      });

      const orgRepo = createMockOrganisationsRepo();
      const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
      const assignmentsRepo = createMemoryRepo<Assignment>();
      const overridesRepo = createMemoryRepo<Override>();

      const membership = createMembershipService({
        repo: membershipsRepo,
        groups: [tenantMembership.group, workspaceMembership.group],
      });

      const permission = createPermissionService({
        repos: { assignments: assignmentsRepo, overrides: overridesRepo },
        realms: [tenantPermission.realm, workspacePermission.realm],
      });

      const orgApi = createOrganisationService({
        repo: orgRepo,
        deps: { membership, permission },
        organisations: [TenantOrg, WorkspaceOrg],
      });

      const acme = await orgApi.create({ name: "Acme", slug: "acme-tenant", type: "tenant" });
      const dev = await orgApi.create({
        name: "Dev Team",
        slug: "dev-workspace",
        type: "workspace",
      });

      await orgApi.addMember({ organisation: acme, member: { id: "u1" }, role: "owner" });
      await orgApi.addMember({ organisation: dev, member: { id: "u1" }, role: "member" });

      const orgs = await orgApi.listForMember({ member: { id: "u1" } });
      expect(orgs).toHaveLength(2);
      const tenantOrgs = orgs.filter((o) => o.type === "tenant");
      const workspaceOrgs = orgs.filter((o) => o.type === "workspace");
      expect(tenantOrgs).toHaveLength(1);
      expect(workspaceOrgs).toHaveLength(1);
      expect(tenantOrgs[0].name).toBe("Acme");
      expect(workspaceOrgs[0].name).toBe("Dev Team");
    });

    test("can() uses correct permission per org type (tenant owner vs workspace viewer)", async () => {
      const userMember = defineMember({ name: "user" });
      const userActor = defineActor({ name: "user" });

      const tenantMembership = createStandardOrganisationMembership({
        name: "tenant",
        member: userMember,
      });
      const tenantPermission = createStandardOrganisationPermission({
        name: "tenant",
        actor: userActor,
      });
      const TenantOrg = defineOrganisation({
        name: "tenant",
        realm: tenantPermission.realm,
        group: tenantMembership.group,
      });

      const workspaceMembership = createStandardOrganisationMembership({
        name: "workspace",
        member: userMember,
      });
      const workspacePermission = createStandardOrganisationPermission({
        name: "workspace",
        actor: userActor,
      });
      const WorkspaceOrg = defineOrganisation({
        name: "workspace",
        realm: workspacePermission.realm,
        group: workspaceMembership.group,
      });

      const orgRepo = createMockOrganisationsRepo();
      const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
      const assignmentsRepo = createMemoryRepo<Assignment>();
      const overridesRepo = createMemoryRepo<Override>();

      const membership = createMembershipService({
        repo: membershipsRepo,
        groups: [tenantMembership.group, workspaceMembership.group],
      });

      const permission = createPermissionService({
        repos: { assignments: assignmentsRepo, overrides: overridesRepo },
        realms: [tenantPermission.realm, workspacePermission.realm],
      });

      const orgApi = createOrganisationService({
        repo: orgRepo,
        deps: { membership, permission },
        organisations: [TenantOrg, WorkspaceOrg],
      });

      const acme = await orgApi.create({ name: "Acme", slug: "acme-tenant", type: "tenant" });
      const dev = await orgApi.create({
        name: "Dev Team",
        slug: "dev-workspace",
        type: "workspace",
      });

      await orgApi.addMember({ organisation: acme, member: { id: "u1" }, role: "owner" });
      await orgApi.addMember({ organisation: dev, member: { id: "u1" }, role: "viewer" });

      const canDeleteTenant = await orgApi.can({
        organisation: acme,
        member: { id: "u1" },
        permission: tenantPermission.permissions.organisationDelete,
      });
      expect(canDeleteTenant).toBe(true);

      const canDeleteWorkspace = await orgApi.can({
        organisation: dev,
        member: { id: "u1" },
        permission: workspacePermission.permissions.organisationDelete,
      });
      expect(canDeleteWorkspace).toBe(false);

      const canReadWorkspace = await orgApi.can({
        organisation: dev,
        member: { id: "u1" },
        permission: workspacePermission.permissions.organisationRead,
      });
      expect(canReadWorkspace).toBe(true);
    });
  });

  describe("full custom config E2E", () => {
    test("custom realm with custom permissions and roles, full CRUD + membership flow", async () => {
      const customActor = defineActor({ name: "user" });
      const customScope = defineScope({ name: "company" });

      const customPermissions = {
        read: defineAtomicPermission({ action: "company:read" }),
        update: defineAtomicPermission({ action: "company:update" }),
        delete: defineAtomicPermission({ action: "company:delete" }),
        billingView: defineAtomicPermission({ action: "billing:view" }),
      };

      const customRoles = {
        owner: defineRole({
          name: "owner",
          realm: "company",
          permissions: [
            customPermissions.read,
            customPermissions.update,
            customPermissions.delete,
            customPermissions.billingView,
          ],
        }),
        viewer: defineRole({
          name: "viewer",
          realm: "company",
          permissions: [customPermissions.read],
        }),
      };

      const customRealm = defineRealm({
        name: "company",
        scope: customScope,
        actors: [customActor],
        permissions: Object.values(customPermissions),
        roles: Object.values(customRoles),
      });

      const customMember = defineMember({ name: "user" });
      const customGroup = defineGroup({ name: "company", member: customMember });

      const CompanyOrg = defineOrganisation({
        name: "company",
        realm: customRealm,
        group: customGroup,
      });

      const orgRepo = createMockOrganisationsRepo();
      const membershipsRepo = createMemoryRepo<Membership>() as MembershipsRepo;
      const assignmentsRepo = createMemoryRepo<Assignment>();
      const overridesRepo = createMemoryRepo<Override>();

      const membership = createMembershipService({
        repo: membershipsRepo,
        groups: [customGroup],
      });

      const permission = createPermissionService({
        repos: { assignments: assignmentsRepo, overrides: overridesRepo },
        realms: [customRealm],
      });

      const orgApi = createOrganisationService({
        repo: orgRepo,
        deps: { membership, permission },
        organisations: [CompanyOrg],
      });

      const corp = await orgApi.create({ name: "Corp Inc", slug: "corp", type: "company" });
      await orgApi.addMember({ organisation: corp, member: { id: "ceo" }, role: "owner" });
      await orgApi.addMember({ organisation: corp, member: { id: "guest" }, role: "viewer" });

      const ownerCanBilling = await orgApi.can({
        organisation: corp,
        member: { id: "ceo" },
        permission: customPermissions.billingView,
      });
      expect(ownerCanBilling).toBe(true);

      const viewerCanBilling = await orgApi.can({
        organisation: corp,
        member: { id: "guest" },
        permission: customPermissions.billingView,
      });
      expect(viewerCanBilling).toBe(false);

      const updated = await orgApi.update({
        id: corp.id,
        data: { name: "Corp Inc Updated" },
        member: { id: "ceo" },
      });
      expect(updated.name).toBe("Corp Inc Updated");

      await orgApi.delete({ id: corp.id, member: { id: "ceo" } });
      const deleted = await orgApi.findById(corp.id);
      expect(deleted).toBeNull();
    });
  });
});

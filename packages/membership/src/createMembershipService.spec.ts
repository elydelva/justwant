import { describe, expect, test } from "bun:test";
import { createMembershipService } from "./createMembershipService.js";
import { defineGroup } from "./defineGroup.js";
import { defineMember } from "./defineMember.js";
import { AlreadyMemberError, InvalidMemberTypeError, NotMemberError } from "./errors/index.js";
import type { Membership, MembershipsRepo } from "./types/index.js";

function createMockRepo(): MembershipsRepo {
  const store = new Map<string, Membership>();
  let idCounter = 0;

  return {
    async findById(id: string) {
      return store.get(id) ?? null;
    },
    async findOne(where: Partial<Membership>) {
      for (const m of store.values()) {
        if (
          (where.memberType == null || m.memberType === where.memberType) &&
          (where.memberId == null || m.memberId === where.memberId) &&
          (where.groupType == null || m.groupType === where.groupType) &&
          (where.groupId == null || m.groupId === where.groupId)
        ) {
          return m;
        }
      }
      return null;
    },
    async findMany(where: Partial<Membership>) {
      const result: Membership[] = [];
      for (const m of store.values()) {
        if (
          (where.memberType == null || m.memberType === where.memberType) &&
          (where.memberId == null || m.memberId === where.memberId) &&
          (where.groupType == null || m.groupType === where.groupType) &&
          (where.groupId == null || m.groupId === where.groupId)
        ) {
          result.push(m);
        }
      }
      return result;
    },
    async create(data) {
      const id = `m_${++idCounter}`;
      const membership: Membership = {
        id,
        memberType: data.memberType,
        memberId: data.memberId,
        groupType: data.groupType,
        groupId: data.groupId,
      };
      store.set(id, membership);
      return membership;
    },
    async update(id, data) {
      const existing = store.get(id);
      if (!existing) throw new Error("Not found");
      const updated = { ...existing, ...data };
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      store.delete(id);
    },
  };
}

describe("createMembershipService", () => {
  test("add adds member to group", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });

    await membership.add(userMember("usr_1"), orgGroup("org_1"));

    const has = await membership.has(userMember("usr_1"), orgGroup("org_1"));
    expect(has).toBe(true);
  });

  test("remove removes member from group", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });

    await membership.add(userMember("usr_1"), orgGroup("org_1"));
    await membership.remove(userMember("usr_1"), orgGroup("org_1"));

    const has = await membership.has(userMember("usr_1"), orgGroup("org_1"));
    expect(has).toBe(false);
  });

  test("has returns false when member not in group", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });

    const has = await membership.has(userMember("usr_1"), orgGroup("org_1"));
    expect(has).toBe(false);
  });

  test("add throws InvalidMemberTypeError when member type not accepted by group", async () => {
    const userMember = defineMember({ name: "user" });
    const botMember = defineMember({ name: "bot" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });

    await expect(membership.add(botMember("bot_1"), orgGroup("org_1"))).rejects.toThrow(
      InvalidMemberTypeError
    );
    await expect(membership.add(botMember("bot_1"), orgGroup("org_1"))).rejects.toThrow(
      /not registered/
    );
  });

  test("add throws AlreadyMemberError when member already in group", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });

    await membership.add(userMember("usr_1"), orgGroup("org_1"));

    await expect(membership.add(userMember("usr_1"), orgGroup("org_1"))).rejects.toThrow(
      AlreadyMemberError
    );
  });

  test("remove throws NotMemberError when member not in group", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });

    await expect(membership.remove(userMember("usr_1"), orgGroup("org_1"))).rejects.toThrow(
      NotMemberError
    );
  });

  test("add throws InvalidMemberTypeError when member type not registered", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });

    await expect(membership.add({ type: "unknown", id: "x" }, orgGroup("org_1"))).rejects.toThrow(
      InvalidMemberTypeError
    );
    await expect(membership.add({ type: "unknown", id: "x" }, orgGroup("org_1"))).rejects.toThrow(
      /not registered/
    );
  });

  test("listMembers returns members of group", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });

    await membership.add(userMember("usr_1"), orgGroup("org_1"));
    await membership.add(userMember("usr_2"), orgGroup("org_1"));

    const members = await membership.listMembers(orgGroup("org_1"));
    expect(members).toHaveLength(2);
    expect(members).toContainEqual({ type: "user", id: "usr_1" });
    expect(members).toContainEqual({ type: "user", id: "usr_2" });
  });

  test("listMembers returns empty array when group has no members", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });

    const members = await membership.listMembers(orgGroup("org_1"));
    expect(members).toEqual([]);
  });

  test("listGroups returns groups of member", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const groupGroup = defineGroup({ name: "group", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup, groupGroup],
    });

    await membership.add(userMember("usr_1"), orgGroup("org_1"));
    await membership.add(userMember("usr_1"), groupGroup("grp_1"));

    const groups = await membership.listGroups(userMember("usr_1"));
    expect(groups).toHaveLength(2);
    expect(groups).toContainEqual({ type: "org", id: "org_1" });
    expect(groups).toContainEqual({ type: "group", id: "grp_1" });
  });

  test("same member can be in multiple groups", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const groupGroup = defineGroup({ name: "group", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup, groupGroup],
    });

    await membership.add(userMember("usr_1"), orgGroup("org_1"));
    await membership.add(userMember("usr_1"), groupGroup("grp_1"));

    expect(await membership.has(userMember("usr_1"), orgGroup("org_1"))).toBe(true);
    expect(await membership.has(userMember("usr_1"), groupGroup("grp_1"))).toBe(true);
  });

  test("MemberLike accepts identity-like defs (defineMember satisfies)", async () => {
    const userMember = defineMember({ name: "user" });
    const orgGroup = defineGroup({ name: "org", member: userMember });
    const membership = createMembershipService({
      repo: createMockRepo(),
      groups: [orgGroup],
    });
    await membership.add(userMember("usr_1"), orgGroup("org_1"));
    expect(await membership.has(userMember("usr_1"), orgGroup("org_1"))).toBe(true);
  });
});

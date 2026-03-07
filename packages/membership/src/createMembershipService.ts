/**
 * @justwant/membership — createMembershipService
 * Creates a membership API that links members to groups.
 * Member type must be declared as accepted by the group (via defineGroup({ member })).
 */

import { AlreadyMemberError } from "./errors/AlreadyMemberError.js";
import { InvalidMemberTypeError } from "./errors/InvalidMemberTypeError.js";
import { NotMemberError } from "./errors/NotMemberError.js";
import type { GroupLike } from "./types/index.js";
import type { MemberLike } from "./types/index.js";
import type { Group, Member, MembershipsRepo } from "./types/index.js";

export interface CreateMembershipServiceOptions {
  repo: MembershipsRepo;
  /** Groups to support. Members are derived from group.member. */
  groups: readonly GroupLike[];
}

function deriveMembersFromGroups(groups: readonly GroupLike[]): MemberLike[] {
  const byName = new Map<string, MemberLike>();
  for (const g of groups) {
    const m = g.member;
    if (!byName.has(m.name)) {
      byName.set(m.name, m);
    }
  }
  return [...byName.values()];
}

export interface MembershipApi {
  add(member: Member, group: Group): Promise<void>;
  remove(member: Member, group: Group): Promise<void>;
  has(member: Member, group: Group): Promise<boolean>;
  listMembers(group: Group): Promise<Member[]>;
  listGroups(member: Member): Promise<Group[]>;
}

function ensureMemberRegistered(member: Member, members: readonly MemberLike[]): void {
  const registered = members.some((m) => m.name === member.type);
  if (!registered) {
    throw new InvalidMemberTypeError(
      `Member type "${member.type}" is not registered`,
      member.type,
      "",
      ""
    );
  }
}

function ensureGroupRegistered(group: Group, groups: readonly GroupLike[]): void {
  const registered = groups.some((g) => g.name === group.type);
  if (!registered) {
    throw new InvalidMemberTypeError(
      `Group type "${group.type}" is not registered`,
      "",
      group.type,
      ""
    );
  }
}

function ensureMemberTypeAccepted(member: Member, group: Group, groupLike: GroupLike): void {
  if (member.type !== groupLike.member.name) {
    throw new InvalidMemberTypeError(
      `Group "${groupLike.name}" accepts member type "${groupLike.member.name}", not "${member.type}"`,
      member.type,
      group.type,
      groupLike.member.name
    );
  }
}

export function createMembershipService(options: CreateMembershipServiceOptions): MembershipApi {
  const { repo, groups } = options;
  const groupList = [...groups];
  const memberList = deriveMembersFromGroups(groupList);

  return {
    async add(member: Member, group: Group): Promise<void> {
      ensureMemberRegistered(member, memberList);
      ensureGroupRegistered(group, groupList);

      const groupLike = groupList.find((g) => g.name === group.type);
      if (!groupLike) return;
      ensureMemberTypeAccepted(member, group, groupLike);

      const existing = await repo.findOne({
        memberType: member.type,
        memberId: member.id,
        groupType: group.type,
        groupId: group.id,
      });

      if (existing) {
        throw new AlreadyMemberError(
          `Member ${member.type}:${member.id} is already in group ${group.type}:${group.id}`,
          member.type,
          member.id,
          group.type,
          group.id
        );
      }

      await repo.create({
        memberType: member.type,
        memberId: member.id,
        groupType: group.type,
        groupId: group.id,
      });
    },

    async remove(member: Member, group: Group): Promise<void> {
      ensureMemberRegistered(member, memberList);
      ensureGroupRegistered(group, groupList);

      const existing = await repo.findOne({
        memberType: member.type,
        memberId: member.id,
        groupType: group.type,
        groupId: group.id,
      });

      if (!existing) {
        throw new NotMemberError(
          `Member ${member.type}:${member.id} is not in group ${group.type}:${group.id}`,
          member.type,
          member.id,
          group.type,
          group.id
        );
      }

      await repo.delete(existing.id);
    },

    async has(member: Member, group: Group): Promise<boolean> {
      ensureMemberRegistered(member, memberList);
      ensureGroupRegistered(group, groupList);

      const existing = await repo.findOne({
        memberType: member.type,
        memberId: member.id,
        groupType: group.type,
        groupId: group.id,
      });

      return existing !== null;
    },

    async listMembers(group: Group): Promise<Member[]> {
      ensureGroupRegistered(group, groupList);

      const memberships = await repo.findMany({
        groupType: group.type,
        groupId: group.id,
      });

      return memberships.map((m) => {
        const memberLike = memberList.find((md) => md.name === m.memberType);
        if (!memberLike) {
          throw new InvalidMemberTypeError(
            `Member type "${m.memberType}" is not registered`,
            m.memberType,
            "",
            ""
          );
        }
        return memberLike(m.memberId) as Member;
      });
    },

    async listGroups(member: Member): Promise<Group[]> {
      ensureMemberRegistered(member, memberList);

      const memberships = await repo.findMany({
        memberType: member.type,
        memberId: member.id,
      });

      return memberships.map((m) => {
        const groupLike = groupList.find((g) => g.name === m.groupType);
        if (!groupLike) {
          throw new InvalidMemberTypeError(
            `Group type "${m.groupType}" is not registered`,
            "",
            m.groupType,
            ""
          );
        }
        return groupLike(m.groupId) as Group;
      });
    },
  };
}

/**
 * @justwant/membership — createMembership
 * Creates a membership API that links members to groups.
 * Member type must be declared as accepted by the group (via createGroup({ member })).
 */

import type { GroupDef } from "./createGroup.js";
import type { MemberDef } from "./createMember.js";
import { AlreadyMemberError } from "./errors/AlreadyMemberError.js";
import { InvalidMemberTypeError } from "./errors/InvalidMemberTypeError.js";
import { NotMemberError } from "./errors/NotMemberError.js";
import type { Group, Member, MembershipsRepo } from "./types/index.js";

export interface CreateMembershipOptions {
  repo: MembershipsRepo;
  members: readonly MemberDef[];
  groups: readonly GroupDef[];
}

export interface MembershipApi {
  add(member: Member, group: Group): Promise<void>;
  remove(member: Member, group: Group): Promise<void>;
  has(member: Member, group: Group): Promise<boolean>;
  listMembers(group: Group): Promise<Member[]>;
  listGroups(member: Member): Promise<Group[]>;
}

function ensureMemberRegistered(member: Member, members: readonly MemberDef[]): void {
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

function ensureGroupRegistered(group: Group, groups: readonly GroupDef[]): void {
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

function ensureMemberTypeAccepted(member: Member, group: Group, groupDef: GroupDef): void {
  if (member.type !== groupDef.member.name) {
    throw new InvalidMemberTypeError(
      `Group "${groupDef.name}" accepts member type "${groupDef.member.name}", not "${member.type}"`,
      member.type,
      group.type,
      groupDef.member.name
    );
  }
}

export function createMembership(options: CreateMembershipOptions): MembershipApi {
  const { repo, members, groups } = options;
  const memberList = [...members];
  const groupList = [...groups];

  return {
    async add(member: Member, group: Group): Promise<void> {
      ensureMemberRegistered(member, memberList);
      ensureGroupRegistered(group, groupList);

      const groupDef = groupList.find((g) => g.name === group.type);
      if (!groupDef) return;
      ensureMemberTypeAccepted(member, group, groupDef);

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
        const memberDef = memberList.find((md) => md.name === m.memberType);
        if (!memberDef) {
          throw new InvalidMemberTypeError(
            `Member type "${m.memberType}" is not registered`,
            m.memberType,
            "",
            ""
          );
        }
        return memberDef(m.memberId);
      });
    },

    async listGroups(member: Member): Promise<Group[]> {
      ensureMemberRegistered(member, memberList);

      const memberships = await repo.findMany({
        memberType: member.type,
        memberId: member.id,
      });

      return memberships.map((m) => {
        const groupDef = groupList.find((g) => g.name === m.groupType);
        if (!groupDef) {
          throw new InvalidMemberTypeError(
            `Group type "${m.groupType}" is not registered`,
            "",
            m.groupType,
            ""
          );
        }
        return groupDef(m.groupId);
      });
    },
  };
}

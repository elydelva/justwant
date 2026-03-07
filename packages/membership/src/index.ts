/**
 * @justwant/membership — Member–group liaison
 * createMember, createGroup, createMembership.
 * No roles, no within. Member type declared in group.
 */

export { createMember } from "./createMember.js";
export type { CreateMemberOptions, MemberDef } from "./createMember.js";

export { createGroup } from "./createGroup.js";
export type { CreateGroupOptions, GroupDef } from "./createGroup.js";

export { createMembership } from "./createMembership.js";
export type { CreateMembershipOptions, MembershipApi } from "./createMembership.js";

export type {
  Member,
  Group,
  Membership,
  MembershipsRepo,
  CreateInput,
} from "./types/index.js";

export {
  MembershipError,
  AlreadyMemberError,
  NotMemberError,
  InvalidMemberTypeError,
} from "./errors/index.js";

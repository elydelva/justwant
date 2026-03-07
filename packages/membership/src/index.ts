/**
 * @justwant/membership — Member–group liaison
 * defineMember, defineGroup, createMembershipService.
 * No roles, no within. Member type declared in group.
 */

export { defineMember } from "./defineMember.js";
export type { DefineMemberOptions, MemberDef } from "./defineMember.js";

export { defineGroup } from "./defineGroup.js";
export type { DefineGroupOptions, GroupDef } from "./defineGroup.js";

export { createMembershipService } from "./createMembershipService.js";
export type {
  CreateMembershipServiceOptions,
  MembershipApi,
} from "./createMembershipService.js";

export type {
  Member,
  Group,
  Membership,
  MembershipsRepo,
  CreateInput,
  MemberLike,
  GroupLike,
} from "./types/index.js";

export {
  MembershipError,
  AlreadyMemberError,
  NotMemberError,
  InvalidMemberTypeError,
} from "./errors/index.js";

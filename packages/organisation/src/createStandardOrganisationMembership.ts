/**
 * @justwant/organisation — createStandardOrganisationMembership
 * Generates membership definitions (member, group) for an organisation type.
 * Group name is derived from the org type name (e.g. "tenant" → group "tenant").
 */

import { defineGroup } from "@justwant/membership";
import type { GroupDef, MemberLike } from "@justwant/membership";

export interface CreateStandardOrganisationMembershipOptions<N extends string = string> {
  name: N;
  member: MemberLike;
}

export interface StandardOrganisationMembershipResult<N extends string = string> {
  member: MemberLike;
  group: GroupDef<N>;
}

export function createStandardOrganisationMembership<N extends string>(
  options: CreateStandardOrganisationMembershipOptions<N>
): StandardOrganisationMembershipResult<N> {
  const { name, member } = options;
  const group = defineGroup({ name, member });
  return { member, group };
}

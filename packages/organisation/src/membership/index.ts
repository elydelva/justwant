/**
 * @justwant/organisation — Membership definitions
 * OrganisationMember and OrganisationGroup for use with createMembershipService.
 * Alias of createStandardOrganisationMembership({ name: "organisation", member }) for backward compatibility.
 */

import { defineMember } from "@justwant/membership";
import { createStandardOrganisationMembership } from "../createStandardOrganisationMembership.js";

const OrganisationMember = defineMember({ name: "user" });
const { member, group: OrganisationGroup } = createStandardOrganisationMembership({
  name: "organisation",
  member: OrganisationMember,
});

export { member as OrganisationMember };
export { OrganisationGroup };

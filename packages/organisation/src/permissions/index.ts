/**
 * @justwant/organisation — Permissions and realm
 * Atomic permissions and default roles for organisation scope.
 * Alias of createStandardOrganisationPermission({ name: "organisation", actor }) for backward compatibility.
 */

import { defineActor } from "@justwant/permission";
import { createStandardOrganisationPermission } from "../createStandardOrganisationPermission.js";

const userActor = defineActor({ name: "user" });
const {
  realm: OrganisationRealm,
  permissions: OrganisationPermissions,
  roles: OrganisationRoles,
} = createStandardOrganisationPermission({ name: "organisation", actor: userActor });

export { OrganisationPermissions };
export { OrganisationRoles };
export { OrganisationRealm };

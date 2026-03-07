/**
 * @justwant/organisation — Organisation entity and facade
 * defineOrganisation, createOrganisationService, createStandardOrganisationMembership, createStandardOrganisationPermission.
 * Integrates membership and permission via deps.
 */

export { defineOrganisation } from "./defineOrganisation.js";
export type { OrgDef, DefineOrganisationOptions } from "./defineOrganisation.js";

export { createStandardOrganisationMembership } from "./createStandardOrganisationMembership.js";
export type {
  CreateStandardOrganisationMembershipOptions,
  StandardOrganisationMembershipResult,
} from "./createStandardOrganisationMembership.js";

export { createStandardOrganisationPermission } from "./createStandardOrganisationPermission.js";
export type {
  CreateStandardOrganisationPermissionOptions,
  StandardOrganisationPermissionResult,
} from "./createStandardOrganisationPermission.js";

export { createOrganisationService } from "./createOrganisationService.js";
export type {
  CreateOrganisationServiceOptions,
  OrganisationApi,
  CanParams,
  AddMemberParams,
  RemoveMemberParams,
  ListMembersParams,
  ListForMemberParams,
  AssignRoleParams,
  UpdateParams,
  DeleteParams,
} from "./createOrganisationService.js";

export type {
  Organisation,
  OrgRef,
  OrganisationsRepo,
  CreateInput,
} from "./types/index.js";

export {
  OrganisationError,
  OrganisationNotFoundError,
  DuplicateSlugError,
} from "./errors/index.js";

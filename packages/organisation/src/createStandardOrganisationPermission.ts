/**
 * @justwant/organisation — createStandardOrganisationPermission
 * Generates permission definitions (realm, permissions, roles) for an organisation type.
 * Permissions and scope are named from the org type (e.g. "tenant" → "tenant:read", scope "tenant").
 */

import { defineAtomicPermission, defineRealm, defineRole, defineScope } from "@justwant/permission";
import type { IdentityLike } from "@justwant/permission";
import type { AtomicPermission } from "@justwant/permission";
import type { RealmDef } from "@justwant/permission";
import type { RoleDef } from "@justwant/permission";

export interface CreateStandardOrganisationPermissionOptions<N extends string = string> {
  name: N;
  actor: IdentityLike;
}

export interface StandardOrganisationPermissionResult<N extends string = string> {
  realm: RealmDef;
  permissions: {
    organisationRead: AtomicPermission;
    organisationUpdate: AtomicPermission;
    organisationDelete: AtomicPermission;
    organisationTransfer: AtomicPermission;
    memberList: AtomicPermission;
    memberInvite: AtomicPermission;
    memberRemove: AtomicPermission;
    memberUpdateRole: AtomicPermission;
    settingsView: AtomicPermission;
    settingsEdit: AtomicPermission;
  };
  roles: {
    owner: RoleDef;
    admin: RoleDef;
    member: RoleDef;
    viewer: RoleDef;
  };
}

export function createStandardOrganisationPermission<N extends string>(
  options: CreateStandardOrganisationPermissionOptions<N>
): StandardOrganisationPermissionResult<N> {
  const { name, actor } = options;

  const prefix = `${name}:`;
  const permissions = {
    organisationRead: defineAtomicPermission({ action: `${prefix}read` }),
    organisationUpdate: defineAtomicPermission({ action: `${prefix}update` }),
    organisationDelete: defineAtomicPermission({ action: `${prefix}delete` }),
    organisationTransfer: defineAtomicPermission({ action: `${prefix}transfer` }),
    memberList: defineAtomicPermission({ action: "member:list" }),
    memberInvite: defineAtomicPermission({ action: "member:invite" }),
    memberRemove: defineAtomicPermission({ action: "member:remove" }),
    memberUpdateRole: defineAtomicPermission({ action: "member:updateRole" }),
    settingsView: defineAtomicPermission({ action: "settings:view" }),
    settingsEdit: defineAtomicPermission({ action: "settings:edit" }),
  } as const;

  const allPermissions = Object.values(permissions);

  const roles = {
    owner: defineRole({
      name: "owner",
      realm: name,
      permissions: allPermissions,
    }),
    admin: defineRole({
      name: "admin",
      realm: name,
      permissions: [
        permissions.organisationRead,
        permissions.organisationUpdate,
        permissions.memberList,
        permissions.memberInvite,
        permissions.memberRemove,
        permissions.memberUpdateRole,
        permissions.settingsView,
        permissions.settingsEdit,
      ],
    }),
    member: defineRole({
      name: "member",
      realm: name,
      permissions: [permissions.organisationRead, permissions.memberList],
    }),
    viewer: defineRole({
      name: "viewer",
      realm: name,
      permissions: [permissions.organisationRead],
    }),
  } as const;

  const scope = defineScope({ name });
  const realm = defineRealm({
    name,
    scope,
    actors: [actor],
    permissions: allPermissions,
    roles: Object.values(roles),
  });

  return { realm, permissions, roles };
}

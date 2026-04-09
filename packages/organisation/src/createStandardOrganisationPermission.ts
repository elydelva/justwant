/**
 * @justwant/organisation — createStandardOrganisationPermission
 * Generates permission definitions (realm, permissions, roles) for an organisation type.
 * Permissions and scope are named from the org type (e.g. "tenant" → "tenant:read", scope "tenant").
 */

import { defineAtomicPermission, defineRealm, defineRole, defineScope } from "@justwant/permission";
import type { AtomicPermission, IdentityLike, RealmDef, RoleDef } from "@justwant/permission";

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
    organisationRead: defineAtomicPermission({ name: `${prefix}read` }),
    organisationUpdate: defineAtomicPermission({ name: `${prefix}update` }),
    organisationDelete: defineAtomicPermission({ name: `${prefix}delete` }),
    organisationTransfer: defineAtomicPermission({ name: `${prefix}transfer` }),
    memberList: defineAtomicPermission({ name: "member:list" }),
    memberInvite: defineAtomicPermission({ name: "member:invite" }),
    memberRemove: defineAtomicPermission({ name: "member:remove" }),
    memberUpdateRole: defineAtomicPermission({ name: "member:updateRole" }),
    settingsView: defineAtomicPermission({ name: "settings:view" }),
    settingsEdit: defineAtomicPermission({ name: "settings:edit" }),
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

/**
 * @justwant/organisation — createOrganisationService
 * Creates an organisation API that orchestrates CRUD, membership, and permission.
 * Supports multiple organisation types via organisations list.
 * Uses organisation and member params (not org/actor).
 */

import { type AtomicPermission, PermissionDeniedError } from "@justwant/permission";
import type { OrgDef } from "./defineOrganisation.js";
import { DuplicateSlugError } from "./errors/DuplicateSlugError.js";
import { OrganisationNotFoundError } from "./errors/OrganisationNotFoundError.js";
import type { CreateInput, Organisation, OrganisationsRepo } from "./types/index.js";

interface MemberLike {
  id: string;
  type?: string;
}

function toMember(m: MemberLike): { type: string; id: string } {
  return { type: m.type ?? "user", id: m.id };
}

export interface CreateOrganisationServiceOptions {
  repo: OrganisationsRepo;
  deps: {
    membership: import("@justwant/membership").MembershipApi;
    permission: import("@justwant/permission").PermissionApi;
  };
  organisations: readonly OrgDef[];
}

export interface CanParams {
  organisation: Organisation;
  member: MemberLike;
  permission: AtomicPermission;
}

export interface AddMemberParams {
  organisation: Organisation;
  member: MemberLike;
  role: string;
}

export interface RemoveMemberParams {
  organisation: Organisation;
  member: MemberLike;
}

export interface ListMembersParams {
  organisation: Organisation;
}

export interface ListForMemberParams {
  member: MemberLike;
}

export interface AssignRoleParams {
  organisation: Organisation;
  member: MemberLike;
  role: string;
}

export interface UpdateParams {
  id: string;
  data: Partial<Organisation>;
  member?: MemberLike;
}

export interface DeleteParams {
  id: string;
  member?: MemberLike;
}

export interface OrganisationApi {
  create(data: CreateInput<Organisation> & { type: string }): Promise<Organisation>;
  findById(id: string): Promise<Organisation | null>;
  findBySlug(slug: string): Promise<Organisation | null>;
  findOne(where: Partial<Organisation>): Promise<Organisation | null>;
  findMany(where: Partial<Organisation>): Promise<Organisation[]>;
  update(params: UpdateParams): Promise<Organisation>;
  delete(params: DeleteParams): Promise<void>;
  addMember(params: AddMemberParams): Promise<void>;
  removeMember(params: RemoveMemberParams): Promise<void>;
  listMembers(params: ListMembersParams): Promise<{ type: string; id: string }[]>;
  listForMember(params: ListForMemberParams): Promise<Organisation[]>;
  can(params: CanParams): Promise<boolean>;
  assignRole(params: AssignRoleParams): Promise<void>;
}

function buildOrgDefMap(organisations: readonly OrgDef[]): Map<string, OrgDef> {
  const map = new Map<string, OrgDef>();
  for (const org of organisations) {
    map.set(org.name, org);
  }
  return map;
}

export function createOrganisationService(
  options: CreateOrganisationServiceOptions
): OrganisationApi {
  const { repo, deps, organisations } = options;
  const { membership, permission } = deps;
  const orgDefMap = buildOrgDefMap(organisations);

  function getOrgDef(type: string): OrgDef {
    const def = orgDefMap.get(type);
    if (!def) {
      throw new Error(`Unknown organisation type: ${type}`);
    }
    return def;
  }

  function toScope(organisation: Organisation) {
    const def = getOrgDef(organisation.type);
    return { type: def.realm.scope.name, id: organisation.id };
  }

  return {
    async create(data) {
      const { type } = data;
      if (!type) {
        throw new Error("Organisation type is required");
      }
      getOrgDef(type);
      if (data.slug) {
        const existing = await repo.findOne({ slug: data.slug });
        if (existing) {
          throw new DuplicateSlugError(
            `Organisation with slug "${data.slug}" already exists`,
            data.slug
          );
        }
      }
      return repo.create(data as CreateInput<Organisation>);
    },

    async findById(id) {
      return repo.findById(id);
    },

    async findBySlug(slug) {
      return repo.findOne({ slug });
    },

    async findOne(where) {
      return repo.findOne(where);
    },

    async findMany(where) {
      return repo.findMany(where);
    },

    async update(params) {
      const { id, data, member } = params;
      const organisation = await repo.findById(id);
      if (!organisation) {
        throw new OrganisationNotFoundError("Organisation not found", id);
      }
      const def = getOrgDef(organisation.type);
      if (member) {
        const updatePerm = def.realm.permissionById.get(`${organisation.type}:update`);
        if (updatePerm) {
          const canUpdate = await permission.can({
            actor: toMember(member),
            action: updatePerm,
            scope: toScope(organisation),
          });
          if (!canUpdate) {
            throw new PermissionDeniedError(
              `Permission denied: ${organisation.type}:update`,
              member.id,
              `${organisation.type}:update`,
              id
            );
          }
        }
      }
      if (data.slug && data.slug !== organisation.slug) {
        const existing = await repo.findOne({ slug: data.slug });
        if (existing) {
          throw new DuplicateSlugError(
            `Organisation with slug "${data.slug}" already exists`,
            data.slug
          );
        }
      }
      return repo.update(id, data);
    },

    async delete(params) {
      const { id, member } = params;
      const organisation = await repo.findById(id);
      if (!organisation) {
        throw new OrganisationNotFoundError("Organisation not found", id);
      }
      const def = getOrgDef(organisation.type);
      if (member) {
        const deletePerm = def.realm.permissionById.get(`${organisation.type}:delete`);
        if (deletePerm) {
          const canDelete = await permission.can({
            actor: toMember(member),
            action: deletePerm,
            scope: toScope(organisation),
          });
          if (!canDelete) {
            throw new PermissionDeniedError(
              `Permission denied: ${organisation.type}:delete`,
              member.id,
              `${organisation.type}:delete`,
              id
            );
          }
        }
      }
      return repo.delete(id);
    },

    async addMember(params) {
      const { organisation, member, role } = params;
      const def = getOrgDef(organisation.type);
      const memberRef = toMember(member);
      const group = def.group(organisation.id);
      await membership.add(memberRef, group);
      const roleDef = def.realm.roleByName.get(role);
      if (roleDef) {
        await permission.assign({
          actor: memberRef,
          role: roleDef,
          scope: toScope(organisation),
        });
      }
    },

    async removeMember(params) {
      const { organisation, member } = params;
      const def = getOrgDef(organisation.type);
      const memberRef = toMember(member);
      const group = def.group(organisation.id);
      await permission.unassign({ actor: memberRef, scope: toScope(organisation) });
      await membership.remove(memberRef, group);
    },

    async listMembers(params) {
      const { organisation } = params;
      const def = getOrgDef(organisation.type);
      const group = def.group(organisation.id);
      return membership.listMembers(group);
    },

    async listForMember(params) {
      const { member } = params;
      const memberRef = toMember(member);
      const groups = await membership.listGroups(memberRef);
      const organisationsList: Organisation[] = [];
      for (const orgDef of organisations) {
        const groupType = orgDef.group.name;
        for (const g of groups) {
          if (g.type === groupType) {
            const org = await repo.findById(g.id);
            if (org) organisationsList.push(org);
          }
        }
      }
      return organisationsList;
    },

    async can(params) {
      const { organisation, member, permission: perm } = params;
      return permission.can({
        actor: toMember(member),
        action: perm,
        scope: toScope(organisation),
      });
    },

    async assignRole(params) {
      const { organisation, member, role } = params;
      const def = getOrgDef(organisation.type);
      const roleDef = def.realm.roleByName.get(role);
      if (!roleDef) {
        throw new Error(`Unknown role: ${role}`);
      }
      await permission.assign({
        actor: toMember(member),
        role: roleDef,
        scope: toScope(organisation),
      });
    },
  };
}

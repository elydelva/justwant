/**
 * @justwant/membership — Core types
 * Member: entity reference (type + id).
 * Group: group reference (type + id) with member type.
 * Membership: persisted link member ↔ group.
 * MembershipsRepo: repository aligned with @justwant/db MappedTable.
 * MemberLike, GroupLike: structural interfaces for cross-package composition (no import).
 */

/** Structural interface for identity-like definitions (UserDef, MemberDef) */
export interface MemberLike {
  readonly name: string;
  (id: string): { type: string; id: string };
}

/** Structural interface for group-like definitions */
export interface GroupLike {
  readonly name: string;
  readonly member: MemberLike;
  (id: string): { type: string; id: string };
}

export interface Member<T extends string = string> {
  type: T;
  id: string;
}

export interface Group<N extends string = string> {
  type: N;
  id: string;
}

export interface Membership {
  id: string;
  memberType: string;
  memberId: string;
  groupType: string;
  groupId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

export interface MembershipsRepo {
  findById(id: string): Promise<Membership | null>;
  findOne(where: Partial<Membership>): Promise<Membership | null>;
  findMany(where: Partial<Membership>): Promise<Membership[]>;
  create(data: CreateInput<Membership>): Promise<Membership>;
  update(id: string, data: Partial<Membership>): Promise<Membership>;
  delete(id: string): Promise<void>;
}

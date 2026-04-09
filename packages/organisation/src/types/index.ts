/**
 * @justwant/organisation — Core types
 * Organisation: full entity with type for multi-type support.
 * OrgRef: reference for permission/membership, generic over org type name.
 * OrganisationsRepo: aligned with @justwant/db MappedTable.
 */

import type { RefLike } from "@justwant/meta";

export interface Organisation<T extends string = string> {
  id: string;
  type: T;
  name: string;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrgRef<N extends string = string> extends RefLike<N> {}

export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

export interface OrganisationsRepo {
  findById(id: string): Promise<Organisation | null>;
  findOne(where: Partial<Organisation>): Promise<Organisation | null>;
  findMany(where: Partial<Organisation>): Promise<Organisation[]>;
  create(data: CreateInput<Organisation>): Promise<Organisation>;
  update(id: string, data: Partial<Organisation>): Promise<Organisation>;
  delete(id: string): Promise<void>;
}

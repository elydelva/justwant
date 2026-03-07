/**
 * @justwant/user — Core types
 * User: full entity (id, email, name).
 * UserRef: identity reference for permission/membership.
 * UsersRepo: repository aligned with @justwant/db MappedTable.
 */

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface UserRef {
  type: "user";
  id: string;
}

export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

export interface UsersRepo {
  findById(id: string): Promise<User | null>;
  findOne(where: Partial<User>): Promise<User | null>;
  findMany(where: Partial<User>): Promise<User[]>;
  create(data: CreateInput<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

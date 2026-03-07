/**
 * @justwant/user — createUserService
 * Creates a user service with CRUD operations via UsersRepo.
 */

import { DuplicateEmailError } from "./errors/DuplicateEmailError.js";
import { UserNotFoundError } from "./errors/UserNotFoundError.js";
import type { CreateInput, User, UsersRepo } from "./types/index.js";

export interface CreateUserServiceOptions {
  repo: UsersRepo;
}

export interface UsersApi {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findOne(where: Partial<User>): Promise<User | null>;
  findMany(where: Partial<User>): Promise<User[]>;
  create(data: CreateInput<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

export function createUserService(options: CreateUserServiceOptions): UsersApi {
  const { repo } = options;

  return {
    async findById(id: string): Promise<User | null> {
      return repo.findById(id);
    },

    async findByEmail(email: string): Promise<User | null> {
      return repo.findOne({ email });
    },

    async findOne(where: Partial<User>): Promise<User | null> {
      return repo.findOne(where);
    },

    async findMany(where: Partial<User>): Promise<User[]> {
      return repo.findMany(where);
    },

    async create(data: CreateInput<User>): Promise<User> {
      if (data.email) {
        const existing = await repo.findOne({ email: data.email });
        if (existing) {
          throw new DuplicateEmailError(
            `User with email "${data.email}" already exists`,
            data.email
          );
        }
      }
      return repo.create(data);
    },

    async update(id: string, data: Partial<User>): Promise<User> {
      const existing = await repo.findById(id);
      if (!existing) {
        throw new UserNotFoundError("User not found", id);
      }
      if (data.email && data.email !== existing.email) {
        const duplicate = await repo.findOne({ email: data.email });
        if (duplicate) {
          throw new DuplicateEmailError(
            `User with email "${data.email}" already exists`,
            data.email
          );
        }
      }
      return repo.update(id, data);
    },

    async delete(id: string): Promise<void> {
      const existing = await repo.findById(id);
      if (!existing) {
        throw new UserNotFoundError("User not found", id);
      }
      return repo.delete(id);
    },
  };
}

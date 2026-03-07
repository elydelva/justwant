import { describe, expect, test } from "bun:test";
import { createUserService } from "./createUserService.js";
import { DuplicateEmailError } from "./errors/DuplicateEmailError.js";
import { UserNotFoundError } from "./errors/UserNotFoundError.js";
import type { User, UsersRepo } from "./types/index.js";

function createMockRepo(initial: User[] = []): UsersRepo {
  const users = new Map<string, User>(initial.map((u) => [u.id, { ...u }]));

  return {
    async findById(id: string) {
      return users.get(id) ?? null;
    },
    async findOne(where: Partial<User>) {
      for (const u of users.values()) {
        if (where.id !== undefined && u.id !== where.id) continue;
        if (where.email !== undefined && u.email !== where.email) continue;
        if (where.name !== undefined && u.name !== where.name) continue;
        return u;
      }
      return null;
    },
    async findMany(where: Partial<User>) {
      return [...users.values()].filter((u) => {
        if (where.id !== undefined && u.id !== where.id) return false;
        if (where.email !== undefined && u.email !== where.email) return false;
        if (where.name !== undefined && u.name !== where.name) return false;
        return true;
      });
    },
    async create(data) {
      const id = `usr_${users.size + 1}`;
      const user: User = { id, email: data.email, name: data.name };
      users.set(id, user);
      return user;
    },
    async update(id, data) {
      const existing = users.get(id);
      if (!existing) throw new Error("not found");
      const updated = { ...existing, ...data };
      users.set(id, updated);
      return updated;
    },
    async delete(id) {
      users.delete(id);
    },
  };
}

describe("createUserService", () => {
  test("findById returns user when exists", async () => {
    const repo = createMockRepo([{ id: "usr_1", email: "a@x.com", name: "Alice" }]);
    const service = createUserService({ repo });

    const user = await service.findById("usr_1");
    expect(user).toEqual({ id: "usr_1", email: "a@x.com", name: "Alice" });
  });

  test("findById returns null when not exists", async () => {
    const repo = createMockRepo();
    const service = createUserService({ repo });

    const user = await service.findById("usr_99");
    expect(user).toBeNull();
  });

  test("findByEmail returns user when exists", async () => {
    const repo = createMockRepo([{ id: "usr_1", email: "a@x.com", name: "Alice" }]);
    const service = createUserService({ repo });

    const user = await service.findByEmail("a@x.com");
    expect(user).toEqual({ id: "usr_1", email: "a@x.com", name: "Alice" });
  });

  test("findOne and findMany work", async () => {
    const repo = createMockRepo([
      { id: "usr_1", email: "a@x.com", name: "Alice" },
      { id: "usr_2", email: "b@x.com", name: "Bob" },
    ]);
    const service = createUserService({ repo });

    const one = await service.findOne({ name: "Alice" });
    expect(one?.email).toBe("a@x.com");

    const many = await service.findMany({});
    expect(many).toHaveLength(2);
  });

  test("create adds user", async () => {
    const repo = createMockRepo();
    const service = createUserService({ repo });

    const user = await service.create({ email: "b@x.com", name: "Bob" });
    expect(user.email).toBe("b@x.com");
    expect(user.name).toBe("Bob");
    expect(user.id).toBeDefined();

    const found = await service.findById(user.id);
    expect(found).toEqual(user);
  });

  test("create throws DuplicateEmailError when email exists", async () => {
    const repo = createMockRepo([{ id: "usr_1", email: "a@x.com", name: "Alice" }]);
    const service = createUserService({ repo });

    await expect(service.create({ email: "a@x.com", name: "Alice2" })).rejects.toThrow(
      DuplicateEmailError
    );
  });

  test("update modifies user", async () => {
    const repo = createMockRepo([{ id: "usr_1", email: "a@x.com", name: "Alice" }]);
    const service = createUserService({ repo });

    const updated = await service.update("usr_1", { name: "Alicia" });
    expect(updated.name).toBe("Alicia");
    expect(updated.email).toBe("a@x.com");
  });

  test("update throws UserNotFoundError when user does not exist", async () => {
    const repo = createMockRepo();
    const service = createUserService({ repo });

    await expect(service.update("usr_99", { name: "X" })).rejects.toThrow(UserNotFoundError);
  });

  test("update throws DuplicateEmailError when changing to existing email", async () => {
    const repo = createMockRepo([
      { id: "usr_1", email: "a@x.com", name: "Alice" },
      { id: "usr_2", email: "b@x.com", name: "Bob" },
    ]);
    const service = createUserService({ repo });

    await expect(service.update("usr_1", { email: "b@x.com" })).rejects.toThrow(
      DuplicateEmailError
    );
  });

  test("delete removes user", async () => {
    const repo = createMockRepo([{ id: "usr_1", email: "a@x.com", name: "Alice" }]);
    const service = createUserService({ repo });

    await service.delete("usr_1");
    const found = await service.findById("usr_1");
    expect(found).toBeNull();
  });

  test("delete throws UserNotFoundError when user does not exist", async () => {
    const repo = createMockRepo();
    const service = createUserService({ repo });

    await expect(service.delete("usr_99")).rejects.toThrow(UserNotFoundError);
  });
});

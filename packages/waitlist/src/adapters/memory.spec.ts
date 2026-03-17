import { describe, expect, test } from "bun:test";
import { createMemoryWaitlistAdapter } from "./memory.js";

describe("createMemoryWaitlistAdapter", () => {
  test("subscribe creates entry with id and createdAt", async () => {
    const repo = createMemoryWaitlistAdapter();
    const entry = await repo.subscribe({
      listKey: "beta",
      actorType: "user",
      actorId: "u1",
    });
    expect(entry.id).toBeDefined();
    expect(entry.createdAt).toBeInstanceOf(Date);
    expect(entry.listKey).toBe("beta");
    expect(entry.actorType).toBe("user");
    expect(entry.actorId).toBe("u1");
  });

  test("unsubscribe removes by listKey and actorKey", async () => {
    const repo = createMemoryWaitlistAdapter();
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "u1" });
    await repo.unsubscribe("beta", "user:u1");
    const found = await repo.findOne({ listKey: "beta", actorType: "user", actorId: "u1" });
    expect(found).toBeNull();
  });

  test("findOne returns match or null", async () => {
    const repo = createMemoryWaitlistAdapter();
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "u1" });
    const found = await repo.findOne({ listKey: "beta", actorType: "user", actorId: "u1" });
    expect(found).not.toBeNull();
    expect(found?.actorId).toBe("u1");
    const notFound = await repo.findOne({ listKey: "beta", actorType: "user", actorId: "u2" });
    expect(notFound).toBeNull();
  });

  test("findMany filters by where, supports orderBy, limit, offset", async () => {
    const repo = createMemoryWaitlistAdapter();
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "a" });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "b" });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "c" });
    const all = await repo.findMany({ listKey: "beta" });
    expect(all).toHaveLength(3);
    const limited = await repo.findMany(
      { listKey: "beta" },
      { limit: 2, offset: 1, orderBy: { field: "actorId", direction: "asc" } }
    );
    expect(limited).toHaveLength(2);
  });

  test("count returns count by where", async () => {
    const repo = createMemoryWaitlistAdapter();
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "u1" });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "u2" });
    expect(await repo.count({ listKey: "beta" })).toBe(2);
    expect(await repo.count({ listKey: "other" })).toBe(0);
  });

  test("delete removes by id", async () => {
    const repo = createMemoryWaitlistAdapter();
    const entry = await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "u1" });
    await repo.delete(entry.id);
    const found = await repo.findOne({ id: entry.id });
    expect(found).toBeNull();
  });

  test("actorKey with orgId", async () => {
    const repo = createMemoryWaitlistAdapter();
    await repo.subscribe({
      listKey: "beta",
      actorType: "user",
      actorId: "u1",
      actorOrgId: "org-1",
    });
    await repo.unsubscribe("beta", "user:u1:org-1");
    const found = await repo.findOne({ listKey: "beta", actorType: "user", actorId: "u1" });
    expect(found).toBeNull();
  });
});

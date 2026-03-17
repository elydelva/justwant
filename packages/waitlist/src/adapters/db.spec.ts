import { describe, expect, test } from "bun:test";
import { createWaitlistDbAdapter } from "./db.js";
import type { WaitlistTable } from "./db.js";

function createMockTable(): WaitlistTable {
  const entries: Array<{
    id: string;
    listKey: string;
    actorType: string;
    actorId: string;
    actorOrgId?: string;
    createdAt: Date;
  }> = [];
  let idCounter = 0;

  return {
    async create(data) {
      const now = new Date();
      const entry = {
        ...data,
        id: `id-${++idCounter}`,
        createdAt: now,
      };
      entries.push(entry);
      return entry as Awaited<ReturnType<WaitlistTable["create"]>>;
    },
    async findOne(where) {
      const match = entries.find((e) =>
        Object.entries(where).every(([k, v]) => (e as Record<string, unknown>)[k] === v)
      );
      return match ?? null;
    },
    async findMany(where) {
      return entries.filter((e) =>
        Object.entries(where).every(([k, v]) => (e as Record<string, unknown>)[k] === v)
      );
    },
    async delete(id) {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx >= 0) entries.splice(idx, 1);
    },
  };
}

describe("createWaitlistDbAdapter", () => {
  test("subscribe delegates to table.create", async () => {
    const table = createMockTable();
    const repo = createWaitlistDbAdapter({ table });
    const entry = await repo.subscribe({
      listKey: "beta",
      actorType: "user",
      actorId: "u1",
    });
    expect(entry.listKey).toBe("beta");
    expect(entry.actorId).toBe("u1");
    expect(entry.id).toBeDefined();
  });

  test("unsubscribe finds and deletes entry", async () => {
    const table = createMockTable();
    const repo = createWaitlistDbAdapter({ table });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "u1" });
    await repo.unsubscribe("beta", "user:u1");
    const found = await repo.findOne({ listKey: "beta", actorType: "user", actorId: "u1" });
    expect(found).toBeNull();
  });

  test("unsubscribe without entry does not throw", async () => {
    const table = createMockTable();
    const repo = createWaitlistDbAdapter({ table });
    await expect(repo.unsubscribe("beta", "user:nonexistent")).resolves.toBeUndefined();
  });

  test("findMany orderBy asc and desc", async () => {
    const table = createMockTable();
    const repo = createWaitlistDbAdapter({ table });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "c" });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "a" });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "b" });
    const asc = await repo.findMany(
      { listKey: "beta" },
      { orderBy: { field: "actorId", direction: "asc" } }
    );
    expect(asc[0]?.actorId).toBe("a");
    const desc = await repo.findMany(
      { listKey: "beta" },
      { orderBy: { field: "actorId", direction: "desc" } }
    );
    expect(desc[0]?.actorId).toBe("c");
  });

  test("findMany limit and offset", async () => {
    const table = createMockTable();
    const repo = createWaitlistDbAdapter({ table });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "1" });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "2" });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "3" });
    const page = await repo.findMany({ listKey: "beta" }, { limit: 2, offset: 1 });
    expect(page).toHaveLength(2);
  });

  test("count returns length of findMany", async () => {
    const table = createMockTable();
    const repo = createWaitlistDbAdapter({ table });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "u1" });
    await repo.subscribe({ listKey: "beta", actorType: "user", actorId: "u2" });
    expect(await repo.count({ listKey: "beta" })).toBe(2);
  });
});

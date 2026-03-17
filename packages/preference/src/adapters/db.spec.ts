import { describe, expect, test } from "bun:test";
import type { PreferenceEntry } from "../types.js";
import { createPreferenceDbAdapter } from "./db.js";
import type { PreferenceTable } from "./db.js";

function createMockTable(): PreferenceTable {
  const entries: PreferenceEntry[] = [];
  let idCounter = 0;

  return {
    async create(data) {
      const now = new Date();
      const entry: PreferenceEntry = {
        ...data,
        id: `id-${++idCounter}`,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      };
      entries.push(entry);
      return entry;
    },
    async findOne(where) {
      const match = entries.find((e) =>
        Object.entries(where).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v)
      );
      return match ?? null;
    },
    async findMany(where) {
      return entries.filter((e) =>
        Object.entries(where).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v)
      );
    },
    async update(id, data) {
      const idx = entries.findIndex((e) => e.id === id);
      const existing = entries[idx];
      if (idx < 0 || !existing) {
        throw new Error(`Not found: ${id}`);
      }
      const updated: PreferenceEntry = {
        ...existing,
        ...data,
        id: existing.id,
        updatedAt: new Date(),
      };
      entries[idx] = updated;
      return updated;
    },
    async delete(id) {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx >= 0) entries.splice(idx, 1);
    },
  };
}

describe("createPreferenceDbAdapter", () => {
  test("create delegates to table.create", async () => {
    const table = createMockTable();
    const repo = createPreferenceDbAdapter({ table });
    const entry = await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
      value: "dark",
    });
    expect(entry.preferenceKey).toBe("theme");
    expect(entry.actorId).toBe("u1");
    expect(entry.value).toBe("dark");
    expect(entry.id).toBeDefined();
  });

  test("findOne delegates to table", async () => {
    const table = createMockTable();
    const repo = createPreferenceDbAdapter({ table });
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
      value: "dark",
    });
    const found = await repo.findOne({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
    });
    expect(found).not.toBeNull();
    expect(found?.value).toBe("dark");
  });

  test("findMany orderBy asc and desc", async () => {
    const table = createMockTable();
    const repo = createPreferenceDbAdapter({ table });
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "c",
      value: "light",
    });
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "a",
      value: "dark",
    });
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "b",
      value: "system",
    });
    const asc = await repo.findMany(
      { preferenceKey: "theme" },
      { orderBy: { field: "actorId", direction: "asc" } }
    );
    expect(asc[0]?.actorId).toBe("a");
    const desc = await repo.findMany(
      { preferenceKey: "theme" },
      { orderBy: { field: "actorId", direction: "desc" } }
    );
    expect(desc[0]?.actorId).toBe("c");
  });

  test("findMany limit and offset", async () => {
    const table = createMockTable();
    const repo = createPreferenceDbAdapter({ table });
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "1",
      value: "light",
    });
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "2",
      value: "dark",
    });
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "3",
      value: "system",
    });
    const page = await repo.findMany({ preferenceKey: "theme" }, { limit: 2, offset: 1 });
    expect(page).toHaveLength(2);
  });

  test("update delegates to table", async () => {
    const table = createMockTable();
    const repo = createPreferenceDbAdapter({ table });
    const created = await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
      value: "light",
    });
    const updated = await repo.update(created.id, { value: "dark" });
    expect(updated.value).toBe("dark");
  });

  test("delete delegates to table", async () => {
    const table = createMockTable();
    const repo = createPreferenceDbAdapter({ table });
    const created = await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
      value: "dark",
    });
    await repo.delete(created.id);
    const found = await repo.findOne({ id: created.id });
    expect(found).toBeNull();
  });
});

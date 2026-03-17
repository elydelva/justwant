import { describe, expect, test } from "bun:test";
import { createMemoryPreferenceAdapter } from "./memory.js";

describe("createMemoryPreferenceAdapter", () => {
  test("create adds entry with id, createdAt, updatedAt", async () => {
    const repo = createMemoryPreferenceAdapter();
    const entry = await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
      value: "dark",
    });
    expect(entry.id).toBeDefined();
    expect(entry.createdAt).toBeInstanceOf(Date);
    expect(entry.updatedAt).toBeInstanceOf(Date);
    expect(entry.preferenceKey).toBe("theme");
    expect(entry.actorType).toBe("user");
    expect(entry.actorId).toBe("u1");
    expect(entry.value).toBe("dark");
  });

  test("findOne returns match or null", async () => {
    const repo = createMemoryPreferenceAdapter();
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
    const notFound = await repo.findOne({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u2",
    });
    expect(notFound).toBeNull();
  });

  test("findMany filters by where, supports orderBy, limit, offset", async () => {
    const repo = createMemoryPreferenceAdapter();
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "a",
      value: "light",
    });
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "b",
      value: "dark",
    });
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "c",
      value: "system",
    });
    const all = await repo.findMany({ preferenceKey: "theme" });
    expect(all).toHaveLength(3);
    const limited = await repo.findMany(
      { preferenceKey: "theme" },
      {
        limit: 2,
        offset: 1,
        orderBy: { field: "actorId", direction: "asc" },
      }
    );
    expect(limited).toHaveLength(2);
    expect(limited[0]?.actorId).toBe("b");
    expect(limited[1]?.actorId).toBe("c");
  });

  test("update modifies entry", async () => {
    const repo = createMemoryPreferenceAdapter();
    const entry = await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
      value: "light",
    });
    const updated = await repo.update(entry.id, { value: "dark" });
    expect(updated.value).toBe("dark");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(entry.updatedAt.getTime());
  });

  test("delete removes by id", async () => {
    const repo = createMemoryPreferenceAdapter();
    const entry = await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
      value: "dark",
    });
    await repo.delete(entry.id);
    const found = await repo.findOne({ id: entry.id });
    expect(found).toBeNull();
  });

  test("findMany with actorOrgId", async () => {
    const repo = createMemoryPreferenceAdapter();
    await repo.create({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
      actorOrgId: "org-1",
      value: "dark",
    });
    const found = await repo.findOne({
      preferenceKey: "theme",
      actorType: "user",
      actorId: "u1",
      actorOrgId: "org-1",
    });
    expect(found).not.toBeNull();
    expect(found?.actorOrgId).toBe("org-1");
  });
});

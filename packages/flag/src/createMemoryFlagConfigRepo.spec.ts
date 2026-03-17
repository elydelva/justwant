import { describe, expect, test } from "bun:test";
import { createMemoryFlagConfigRepo } from "./createMemoryFlagConfigRepo.js";

describe("createMemoryFlagConfigRepo", () => {
  test("create adds override", async () => {
    const repo = createMemoryFlagConfigRepo();
    const created = await repo.create({
      ruleId: "r1",
      config: { pct: 0.5 },
      rolledBack: false,
    });
    expect(created.id).toBeDefined();
    expect(created.ruleId).toBe("r1");
    expect(created.config).toEqual({ pct: 0.5 });
    expect(created.rolledBack).toBe(false);
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  test("findOne returns match", async () => {
    const repo = createMemoryFlagConfigRepo();
    const created = await repo.create({
      ruleId: "r1",
      config: {},
      rolledBack: false,
    });
    const found = await repo.findOne({ id: created.id });
    expect(found).toEqual(created);
  });

  test("findMany with orderBy and limit", async () => {
    const repo = createMemoryFlagConfigRepo();
    await repo.create({ ruleId: "r1", config: {}, rolledBack: false });
    await repo.create({ ruleId: "r1", config: {}, rolledBack: false });
    const list = await repo.findMany(
      { ruleId: "r1" },
      { orderBy: { field: "createdAt", direction: "desc" }, limit: 1 }
    );
    expect(list).toHaveLength(1);
  });

  test("count returns count", async () => {
    const repo = createMemoryFlagConfigRepo();
    await repo.create({ ruleId: "r1", config: {}, rolledBack: false });
    await repo.create({ ruleId: "r1", config: {}, rolledBack: false });
    const n = await repo.count({ ruleId: "r1" });
    expect(n).toBe(2);
  });

  test("update sets rolledBack", async () => {
    const repo = createMemoryFlagConfigRepo();
    const created = await repo.create({
      ruleId: "r1",
      config: {},
      rolledBack: false,
    });
    const updated = await repo.update(created.id, { rolledBack: true });
    expect(updated.rolledBack).toBe(true);
    const found = await repo.findOne({ id: created.id });
    expect(found?.rolledBack).toBe(true);
  });

  test("update throws when not found", async () => {
    const repo = createMemoryFlagConfigRepo();
    await expect(repo.update("nonexistent", { rolledBack: true })).rejects.toThrow(
      "ConfigOverride not found"
    );
  });
});

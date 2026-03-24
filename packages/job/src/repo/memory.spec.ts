import { describe, expect, test } from "bun:test";
import { createMemoryJobRepository } from "./memory.js";

describe("createMemoryJobRepository", () => {
  test("getDefinition returns null for unknown id", async () => {
    const repo = createMemoryJobRepository();
    expect(await repo.getDefinition("x")).toBeNull();
  });

  test("saveDefinition and getDefinition round-trip", async () => {
    const repo = createMemoryJobRepository();
    const def = { id: "job-1" };
    await repo.saveDefinition(def);
    expect(await repo.getDefinition("job-1")).toEqual(def);
  });

  test("listDefinitions returns all saved definitions", async () => {
    const repo = createMemoryJobRepository();
    await repo.saveDefinition({ id: "a" });
    await repo.saveDefinition({ id: "b" });
    const defs = await repo.listDefinitions();
    expect(defs).toHaveLength(2);
    expect(defs.map((d) => d.id).sort()).toEqual(["a", "b"]);
  });

  test("deleteDefinition removes the definition", async () => {
    const repo = createMemoryJobRepository();
    await repo.saveDefinition({ id: "j" });
    await repo.deleteDefinition("j");
    expect(await repo.getDefinition("j")).toBeNull();
    expect(await repo.listDefinitions()).toHaveLength(0);
  });

  test("getPaused returns false by default", async () => {
    const repo = createMemoryJobRepository();
    expect(await repo.getPaused("x")).toBe(false);
  });

  test("setPaused and getPaused round-trip", async () => {
    const repo = createMemoryJobRepository();
    await repo.setPaused("j", true);
    expect(await repo.getPaused("j")).toBe(true);
    await repo.setPaused("j", false);
    expect(await repo.getPaused("j")).toBe(false);
  });

  test("getStats returns zeros for unknown id", async () => {
    const repo = createMemoryJobRepository();
    const stats = await repo.getStats("x");
    expect(stats.runs).toBe(0);
    expect(stats.failures).toBe(0);
  });

  test("incrementRuns increments run count", async () => {
    const repo = createMemoryJobRepository();
    await repo.incrementRuns("j");
    await repo.incrementRuns("j");
    const stats = await repo.getStats("j");
    expect(stats.runs).toBe(2);
  });

  test("incrementFailures increments failure count", async () => {
    const repo = createMemoryJobRepository();
    await repo.incrementFailures("j");
    const stats = await repo.getStats("j");
    expect(stats.failures).toBe(1);
  });

  test("getSkipNextUntil returns null by default", async () => {
    const repo = createMemoryJobRepository();
    expect(await repo.getSkipNextUntil("x")).toBeNull();
  });

  test("setSkipNextUntil with a date persists it", async () => {
    const repo = createMemoryJobRepository();
    const d = new Date(Date.now() + 10000);
    await repo.setSkipNextUntil("j", d);
    expect(await repo.getSkipNextUntil("j")).toEqual(d);
  });

  test("setSkipNextUntil with null clears it", async () => {
    const repo = createMemoryJobRepository();
    const d = new Date(Date.now() + 10000);
    await repo.setSkipNextUntil("j", d);
    await repo.setSkipNextUntil("j", null);
    expect(await repo.getSkipNextUntil("j")).toBeNull();
  });

  test("deleteDefinition also clears paused, stats, skipNextUntil", async () => {
    const repo = createMemoryJobRepository();
    await repo.saveDefinition({ id: "j" });
    await repo.setPaused("j", true);
    await repo.incrementRuns("j");
    await repo.incrementFailures("j");
    const d = new Date(Date.now() + 10000);
    await repo.setSkipNextUntil("j", d);
    await repo.deleteDefinition("j");
    expect(await repo.getPaused("j")).toBe(false);
    expect((await repo.getStats("j")).runs).toBe(0);
    expect(await repo.getSkipNextUntil("j")).toBeNull();
  });
});

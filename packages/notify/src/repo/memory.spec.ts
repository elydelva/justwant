import { describe, expect, test } from "bun:test";
import { createTemplate } from "../createTemplate.js";
import { createMemoryNotifyRepository } from "./memory.js";

describe("createMemoryNotifyRepository", () => {
  test("listTemplates returns empty when no templates", async () => {
    const repo = createMemoryNotifyRepository();
    expect(await repo.listTemplates()).toEqual([]);
  });

  test("getTemplate returns null when id absent", async () => {
    const repo = createMemoryNotifyRepository();
    expect(await repo.getTemplate({ id: "x" })).toBeNull();
  });

  test("createTemplate then listTemplates returns the template", async () => {
    const repo = createMemoryNotifyRepository();
    const t = createTemplate({
      id: "a",
      console: () => ({ level: "info", text: "a" }),
    });
    await repo.createTemplate(t);
    const list = await repo.listTemplates();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("a");
  });

  test("getTemplate returns template after createTemplate", async () => {
    const repo = createMemoryNotifyRepository();
    const t = createTemplate({ id: "b", sms: () => ({ to: "", body: "" }) });
    await repo.createTemplate(t);
    const got = await repo.getTemplate({ id: "b" });
    expect(got?.id).toBe("b");
    expect(got?.versions.sms).toBeDefined();
  });

  test("createTemplate with duplicate id throws", async () => {
    const repo = createMemoryNotifyRepository();
    const t = createTemplate({ id: "dup", console: () => ({ level: "info", text: "" }) });
    await repo.createTemplate(t);
    await expect(repo.createTemplate(t)).rejects.toThrow("already exists");
  });

  test("updateTemplate replaces versions", async () => {
    const repo = createMemoryNotifyRepository();
    const t = createTemplate({
      id: "u",
      console: () => ({ level: "info", text: "old" }),
    });
    await repo.createTemplate(t);
    await repo.updateTemplate({
      id: "u",
      versions: {
        console: () => ({ level: "warn", text: "new" }),
      },
    });
    const got = await repo.getTemplate({ id: "u" });
    expect(got?.versions.console?.({})).toEqual({ level: "warn", text: "new" });
  });

  test("updateTemplate throws when template not found", async () => {
    const repo = createMemoryNotifyRepository();
    await expect(repo.updateTemplate({ id: "missing", versions: {} })).rejects.toThrow("not found");
  });

  test("deleteTemplate removes template", async () => {
    const repo = createMemoryNotifyRepository();
    const t = createTemplate({ id: "d", console: () => ({ level: "info", text: "" }) });
    await repo.createTemplate(t);
    await repo.deleteTemplate({ id: "d" });
    expect(await repo.getTemplate({ id: "d" })).toBeNull();
    expect(await repo.listTemplates()).toHaveLength(0);
  });
});

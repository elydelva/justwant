import { describe, expect, test } from "bun:test";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { createMemoryPreferenceAdapter } from "./adapters/memory.js";
import { createPreferenceService } from "./createPreferenceService.js";
import { definePreference } from "./definePreference.js";
import { PreferenceValidationError } from "./errors.js";

const themeSchemaStandard: StandardSchemaV1<unknown, "light" | "dark" | "system"> = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (val: unknown) => {
      if (val !== "light" && val !== "dark" && val !== "system") {
        return { issues: [{ message: "Must be light, dark, or system" }] };
      }
      return { value: val as "light" | "dark" | "system" };
    },
  },
};

const themePref = definePreference({
  name: "theme",
  schema: themeSchemaStandard,
  default: "system",
});

const emailSchemaStandard: StandardSchemaV1<unknown, boolean> = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (val: unknown) => {
      if (typeof val !== "boolean") {
        return { issues: [{ message: "Must be boolean" }] };
      }
      return { value: val };
    },
  },
};

const emailPref = definePreference({
  name: "notifications.email",
  key: "notifications.email",
  schema: emailSchemaStandard,
  default: true,
});

const actor = { type: "user" as const, id: "u1" };

describe("createPreferenceService", () => {
  test("list returns Record<name, value> with defaults when none set", async () => {
    const service = createPreferenceService({
      preferences: [themePref, emailPref],
      repo: createMemoryPreferenceAdapter(),
    });
    const list = await service.list(actor);
    expect(list).toEqual({
      theme: "system",
      "notifications.email": true,
    });
  });

  test("list returns stored values when set, defaults for others", async () => {
    const service = createPreferenceService({
      preferences: [themePref, emailPref],
      repo: createMemoryPreferenceAdapter(),
    });
    await service.set(actor, themePref, "dark");
    const list = await service.list(actor);
    expect(list.theme).toBe("dark");
    expect(list["notifications.email"]).toBe(true);
  });

  test("get returns default when not set", async () => {
    const service = createPreferenceService({
      preferences: [themePref],
      repo: createMemoryPreferenceAdapter(),
    });
    const value = await service.get(actor, themePref);
    expect(value).toBe("system");
  });

  test("get returns stored value when set", async () => {
    const service = createPreferenceService({
      preferences: [themePref],
      repo: createMemoryPreferenceAdapter(),
    });
    await service.set(actor, themePref, "dark");
    const value = await service.get(actor, themePref);
    expect(value).toBe("dark");
  });

  test("get throws for unknown preference", async () => {
    const service = createPreferenceService({
      preferences: [themePref],
      repo: createMemoryPreferenceAdapter(),
    });
    const unknownPref = definePreference({ name: "unknown" });
    await expect(service.get(actor, unknownPref)).rejects.toThrow(/Unknown preference/);
  });

  test("set creates entry and validates schema", async () => {
    const service = createPreferenceService({
      preferences: [themePref],
      repo: createMemoryPreferenceAdapter(),
    });
    const entry = await service.set(actor, themePref, "dark");
    expect(entry.preferenceKey).toBe("theme");
    expect(entry.value).toBe("dark");
    expect(entry.actorType).toBe("user");
    expect(entry.actorId).toBe("u1");
  });

  test("set throws PreferenceValidationError for invalid value", async () => {
    const service = createPreferenceService({
      preferences: [themePref],
      repo: createMemoryPreferenceAdapter(),
    });
    await expect(service.set(actor, themePref, "invalid")).rejects.toThrow(
      PreferenceValidationError
    );
  });

  test("set updates existing entry", async () => {
    const service = createPreferenceService({
      preferences: [themePref],
      repo: createMemoryPreferenceAdapter(),
    });
    await service.set(actor, themePref, "light");
    const entry = await service.set(actor, themePref, "dark");
    expect(entry.value).toBe("dark");
    const value = await service.get(actor, themePref);
    expect(value).toBe("dark");
  });

  test("setMany sets multiple preferences", async () => {
    const service = createPreferenceService({
      preferences: [themePref, emailPref],
      repo: createMemoryPreferenceAdapter(),
    });
    await service.setMany(actor, [
      { pref: themePref, value: "dark" },
      { pref: emailPref, value: false },
    ]);
    expect(await service.get(actor, themePref)).toBe("dark");
    expect(await service.get(actor, emailPref)).toBe(false);
  });

  test("reset removes entry and returns to default", async () => {
    const service = createPreferenceService({
      preferences: [themePref],
      repo: createMemoryPreferenceAdapter(),
    });
    await service.set(actor, themePref, "dark");
    expect(await service.get(actor, themePref)).toBe("dark");
    await service.reset(actor, themePref);
    expect(await service.get(actor, themePref)).toBe("system");
  });

  test("reset no-op when entry not set", async () => {
    const service = createPreferenceService({
      preferences: [themePref],
      repo: createMemoryPreferenceAdapter(),
    });
    await service.reset(actor, themePref);
    expect(await service.get(actor, themePref)).toBe("system");
  });

  test("actor with within (org) isolates data", async () => {
    const service = createPreferenceService({
      preferences: [themePref],
      repo: createMemoryPreferenceAdapter(),
    });
    const userInOrg = { type: "user" as const, id: "u1", within: { type: "org", id: "org-1" } };
    await service.set(userInOrg, themePref, "dark");
    expect(await service.get(userInOrg, themePref)).toBe("dark");
    expect(await service.get(actor, themePref)).toBe("system");
  });
});

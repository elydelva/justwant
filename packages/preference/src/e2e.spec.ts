/**
 * E2E tests against real DB (SQLite in-memory).
 */
import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { createPreferenceService } from "./createPreferenceService.js";
import { definePreference } from "./definePreference.js";
import {
  CREATE_TABLE_SQL,
  createSqlitePreferenceRepository,
} from "./e2e/sqlitePreferenceRepository.js";

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
  id: "theme",
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
  id: "notifications.email",
  key: "notifications.email",
  schema: emailSchemaStandard,
  default: true,
});

const actor = { type: "user" as const, id: "u1" };

describe("E2E (SQLite)", () => {
  let db: Database;
  let service: ReturnType<typeof createPreferenceService>;

  beforeEach(() => {
    db = new Database(":memory:");
    db.run(CREATE_TABLE_SQL);
    const repo = createSqlitePreferenceRepository(db);
    service = createPreferenceService({
      preferences: [themePref, emailPref],
      repo,
    });
  });

  afterEach(() => {
    db.close();
  });

  test("full CRUD: set, get, list, setMany, reset", async () => {
    expect(await service.get(actor, themePref)).toBe("system");
    expect(await service.get(actor, emailPref)).toBe(true);

    await service.set(actor, themePref, "dark");
    expect(await service.get(actor, themePref)).toBe("dark");

    const list = await service.list(actor);
    expect(list.theme).toBe("dark");
    expect(list["notifications.email"]).toBe(true);

    await service.setMany(actor, [
      { pref: themePref, value: "light" },
      { pref: emailPref, value: false },
    ]);
    expect(await service.get(actor, themePref)).toBe("light");
    expect(await service.get(actor, emailPref)).toBe(false);

    await service.reset(actor, themePref);
    expect(await service.get(actor, themePref)).toBe("system");
  });

  test("Actor with within isolates data", async () => {
    const userInOrg = {
      type: "user" as const,
      id: "u1",
      within: { type: "org", id: "org-1" },
    };

    await service.set(userInOrg, themePref, "dark");
    expect(await service.get(userInOrg, themePref)).toBe("dark");
    expect(await service.get(actor, themePref)).toBe("system");
  });

  test("list returns Record with defaults for unset preferences", async () => {
    const list = await service.list(actor);
    expect(list).toEqual({
      theme: "system",
      "notifications.email": true,
    });
  });
});

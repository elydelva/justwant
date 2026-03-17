import { describe, expect, test } from "bun:test";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { definePreference } from "./definePreference.js";

const themeSchema: StandardSchemaV1<unknown, "light" | "dark" | "system"> = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (val: unknown) => {
      if (val !== "light" && val !== "dark" && val !== "system") {
        return { issues: [{ message: "Invalid" }] };
      }
      return { value: val as "light" | "dark" | "system" };
    },
  },
};

describe("definePreference", () => {
  test("creates preference with id and key defaults to id", () => {
    const pref = definePreference({ id: "theme" });
    expect(pref.id).toBe("theme");
    expect(pref.key).toBe("theme");
  });

  test("creates preference with explicit key", () => {
    const pref = definePreference({ id: "theme", key: "ui.theme" });
    expect(pref.id).toBe("theme");
    expect(pref.key).toBe("ui.theme");
  });

  test("exposes schema on definition", () => {
    const pref = definePreference({ id: "theme", schema: themeSchema });
    expect(pref.schema).toBe(themeSchema);
  });

  test("exposes default on definition", () => {
    const pref = definePreference({
      id: "theme",
      default: "system",
    });
    expect(pref.default).toBe("system");
  });

  test("creates full definition with all options", () => {
    const pref = definePreference({
      id: "theme",
      key: "app.theme",
      schema: themeSchema,
      default: "system",
    });
    expect(pref).toEqual({
      id: "theme",
      key: "app.theme",
      schema: themeSchema,
      default: "system",
    });
  });
});

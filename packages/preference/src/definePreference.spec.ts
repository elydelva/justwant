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
  test("creates preference with name and key defaults to name", () => {
    const pref = definePreference({ name: "theme" });
    expect(pref.name).toBe("theme");
    expect(pref.key).toBe("theme");
  });

  test("creates preference with explicit key", () => {
    const pref = definePreference({ name: "theme", key: "ui.theme" });
    expect(pref.name).toBe("theme");
    expect(pref.key).toBe("ui.theme");
  });

  test("exposes schema on definition", () => {
    const pref = definePreference({ name: "theme", schema: themeSchema });
    expect(pref.schema).toBe(themeSchema);
  });

  test("exposes default on definition", () => {
    const pref = definePreference({ name: "theme", default: "system" });
    expect(pref.default).toBe("system");
  });

  test("is callable — returns typed ref", () => {
    const pref = definePreference({ name: "theme" });
    expect(pref("user-123")).toEqual({ type: "theme", id: "user-123" });
  });

  test("creates full definition with all options", () => {
    const pref = definePreference({
      name: "theme",
      key: "app.theme",
      schema: themeSchema,
      default: "system",
    });
    expect(pref.name).toBe("theme");
    expect(pref.key).toBe("app.theme");
    expect(pref.schema).toBe(themeSchema);
    expect(pref.default).toBe("system");
  });
});

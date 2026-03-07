import { describe, expect, test } from "bun:test";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { buildWhere } from "./buildWhere.js";

const testTable = sqliteTable("test", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
});

const mapping = {
  id: testTable.id,
  email: testTable.email,
  name: testTable.name,
};

describe("buildWhere", () => {
  test("returns undefined for empty where", () => {
    const result = buildWhere(mapping, {});
    expect(result).toBeUndefined();
  });

  test("filters out undefined values", () => {
    const result = buildWhere(mapping, { id: "1", email: undefined, name: undefined });
    expect(result).toBeDefined();
  });

  test("builds condition for single key", () => {
    const result = buildWhere(mapping, { id: "1" });
    expect(result).toBeDefined();
  });

  test("builds condition for multiple keys", () => {
    const result = buildWhere(mapping, { id: "1", email: "a@b.com" });
    expect(result).toBeDefined();
  });

  test("ignores keys not in mapping", () => {
    const result = buildWhere(mapping, { id: "1", unknownKey: "x" } as Record<string, unknown>);
    expect(result).toBeDefined();
  });
});

import { describe, expect, test } from "bun:test";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { buildOrderBy } from "./buildOrderBy.js";

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

describe("buildOrderBy", () => {
  test("returns empty array for empty orderBy", () => {
    const result = buildOrderBy(mapping, {});
    expect(result).toEqual([]);
  });

  test("builds asc for single field", () => {
    const result = buildOrderBy(mapping, { email: "asc" });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeDefined();
  });

  test("builds desc for single field", () => {
    const result = buildOrderBy(mapping, { email: "desc" });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeDefined();
  });

  test("builds multiple orderBy clauses", () => {
    const result = buildOrderBy(mapping, { email: "asc", name: "desc" });
    expect(result).toHaveLength(2);
  });

  test("ignores keys not in mapping", () => {
    const result = buildOrderBy(mapping, {
      email: "asc",
      unknownKey: "desc",
    } as Record<string, "asc" | "desc">);
    expect(result).toHaveLength(1);
  });
});

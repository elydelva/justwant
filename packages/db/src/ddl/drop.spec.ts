import { describe, expect, test } from "bun:test";
import { getDropTableSQL } from "./drop.js";

describe("getDropTableSQL", () => {
  test("SQLite returns DROP TABLE IF EXISTS", () => {
    const sql = getDropTableSQL("users", "sqlite");
    expect(sql).toContain("DROP TABLE IF EXISTS");
    expect(sql).toContain('"users"');
  });

  test("PostgreSQL returns DROP TABLE IF EXISTS", () => {
    const sql = getDropTableSQL("users", "pg");
    expect(sql).toContain("DROP TABLE IF EXISTS");
    expect(sql).toContain('"users"');
  });

  test("PostgreSQL with schema uses schema.table", () => {
    const sql = getDropTableSQL("users", "pg", "public");
    expect(sql).toContain('"public"."users"');
  });

  test("MySQL returns DROP TABLE IF EXISTS with backticks", () => {
    const sql = getDropTableSQL("users", "mysql");
    expect(sql).toContain("DROP TABLE IF EXISTS");
    expect(sql).toContain("`users`");
  });
});

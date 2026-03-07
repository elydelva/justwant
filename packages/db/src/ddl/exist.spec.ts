import { describe, expect, test } from "bun:test";
import { getExistTableSQL } from "./exist.js";

describe("getExistTableSQL", () => {
  test("SQLite returns sqlite_schema query", () => {
    const sql = getExistTableSQL("users", "sqlite");
    expect(sql).toContain("sqlite_schema");
    expect(sql).toContain("table");
    expect(sql).toContain("EXISTS");
  });

  test("PostgreSQL returns information_schema query with schema", () => {
    const sql = getExistTableSQL("users", "pg", "public");
    expect(sql).toContain("information_schema.tables");
    expect(sql).toContain("table_schema");
    expect(sql).toContain("table_name");
  });

  test("PostgreSQL uses public when schema not provided", () => {
    const sql = getExistTableSQL("users", "pg");
    expect(sql).toContain("public");
  });

  test("MySQL returns information_schema query with DATABASE()", () => {
    const sql = getExistTableSQL("users", "mysql");
    expect(sql).toContain("information_schema.tables");
    expect(sql).toContain("DATABASE()");
  });
});

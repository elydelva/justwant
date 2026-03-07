import { describe, expect, test } from "bun:test";
import { getDropTableSQL } from "./drop.js";

describe("getDropTableSQL", () => {
  test("DuckDB returns DROP TABLE IF EXISTS", () => {
    const sql = getDropTableSQL("events", "duckdb");
    expect(sql).toContain("DROP TABLE IF EXISTS");
    expect(sql).toContain('"events"');
  });

  test("ClickHouse returns DROP TABLE IF EXISTS", () => {
    const sql = getDropTableSQL("events", "clickhouse");
    expect(sql).toContain("DROP TABLE IF EXISTS");
    expect(sql).toContain('"events"');
  });

  test("escapes table name", () => {
    const sql = getDropTableSQL("my_table", "duckdb");
    expect(sql).toBe('DROP TABLE IF EXISTS "my_table"');
  });
});

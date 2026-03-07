import { describe, expect, test } from "bun:test";
import { getExistTableSQL } from "./exist.js";

describe("getExistTableSQL", () => {
  test("DuckDB returns information_schema query", () => {
    const sql = getExistTableSQL("events", "duckdb");
    expect(sql).toContain("information_schema.tables");
    expect(sql).toContain("table_name");
    expect(sql).toContain("EXISTS");
  });

  test("ClickHouse returns EXISTS TABLE", () => {
    const sql = getExistTableSQL("events", "clickhouse");
    expect(sql).toContain("EXISTS TABLE");
    expect(sql).toContain('"events"');
  });

  test("escapes table name with quotes", () => {
    const sql = getExistTableSQL("my_table", "duckdb");
    expect(sql).toContain("my_table");
  });

  test("throws for unsupported dialect", () => {
    expect(() => getExistTableSQL("t", "postgres" as "duckdb")).toThrow(
      "Unsupported warehouse dialect"
    );
  });
});

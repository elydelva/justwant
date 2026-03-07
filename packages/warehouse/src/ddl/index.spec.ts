import { describe, expect, test } from "bun:test";
import { defineContract, integer, string } from "@justwant/contract";
import type { WarehouseDialect } from "../types.js";
import { getCreateTableSQL } from "./index.js";

describe("getCreateTableSQL (index)", () => {
  test("returns ClickHouse DDL for dialect clickhouse", () => {
    const contract = defineContract("t", {
      id: string().required(),
      count: integer().optional(),
    });
    const sql = getCreateTableSQL(contract, "clickhouse");
    expect(sql).toContain("ENGINE = MergeTree()");
    expect(sql).toContain("String");
    expect(sql).toContain("Int64");
  });

  test("returns DuckDB DDL for dialect duckdb", () => {
    const contract = defineContract("t", {
      id: string().required(),
      count: integer().optional(),
    });
    const sql = getCreateTableSQL(contract, "duckdb");
    expect(sql).toContain("VARCHAR");
    expect(sql).toContain("BIGINT");
    expect(sql).not.toContain("MergeTree");
  });

  test("throws for unsupported dialect", () => {
    const contract = defineContract("t", { id: string().required() });
    const badDialect = "postgres" as WarehouseDialect;
    expect(() => getCreateTableSQL(contract, badDialect)).toThrow("Unsupported warehouse dialect");
  });
});

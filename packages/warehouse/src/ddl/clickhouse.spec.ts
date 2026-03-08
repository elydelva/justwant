import { describe, expect, test } from "bun:test";
import { date, defineContract, integer, number, string } from "@justwant/contract";
import { getCreateTableSQL } from "./clickhouse.js";

describe("getCreateTableSQL (ClickHouse)", () => {
  test("generates MergeTree table with ORDER BY", () => {
    const contract = defineContract("events", {
      id: string().required(),
      name: string().required(),
      count: integer().optional(),
    });
    const sql = getCreateTableSQL(contract);
    expect(sql).toContain('CREATE TABLE "events"');
    expect(sql).toContain('"id" String');
    expect(sql).toContain('"name" String');
    expect(sql).toContain('"count" Nullable(Int64)');
    expect(sql).toContain("ENGINE = MergeTree()");
    expect(sql).toContain('ORDER BY ("id")');
  });

  test("maps types correctly", () => {
    const contract = defineContract("t", {
      a: string().required(),
      b: integer().required(),
      c: number().optional(),
    });
    const sql = getCreateTableSQL(contract);
    expect(sql).toContain('"a" String');
    expect(sql).toContain('"b" Int64');
    expect(sql).toContain('"c" Nullable(Float64)');
  });

  test("uses first column for ORDER BY", () => {
    const contract = defineContract("t", {
      ts: date().required(),
      val: number().required(),
    });
    const sql = getCreateTableSQL(contract);
    expect(sql).toContain('ORDER BY ("ts")');
  });
});

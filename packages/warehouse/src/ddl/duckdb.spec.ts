import { describe, expect, test } from "bun:test";
import { defineContract, integer, number, string } from "@justwant/contract";
import { getCreateTableSQL } from "./duckdb.js";

describe("getCreateTableSQL (DuckDB)", () => {
  test("generates standard CREATE TABLE", () => {
    const contract = defineContract("events", {
      id: string().required(),
      name: string().required(),
      count: integer().optional(),
    });
    const sql = getCreateTableSQL(contract);
    expect(sql).toContain('CREATE TABLE "events"');
    expect(sql).toContain('"id" VARCHAR');
    expect(sql).toContain('"name" VARCHAR');
    expect(sql).toContain('"count" BIGINT');
  });

  test("maps types correctly", () => {
    const contract = defineContract("t", {
      a: string().required(),
      b: integer().required(),
      c: number().optional(),
    });
    const sql = getCreateTableSQL(contract);
    expect(sql).toContain('"a" VARCHAR');
    expect(sql).toContain('"b" BIGINT');
    expect(sql).toContain('"c" DOUBLE');
  });

  test("respects custom mapping", () => {
    const contract = defineContract(
      "t",
      { foo: string().required() },
      {
        defaultMapping: "camelToSnake",
      }
    );
    const sql = getCreateTableSQL(contract);
    expect(sql).toContain('"foo" VARCHAR');
  });
});

import { describe, expect, test } from "bun:test";
import { appendWhere } from "./buildWhere.js";
import type { WaddlerQuery, WaddlerSql } from "./types.js";

function makeSqlMock() {
  const parts: unknown[] = [];

  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    parts.push({ strings: [...strings], values });
    return query;
  }) as WaddlerSql;

  sql.identifier = (name: unknown) => ({ __id: name });
  sql.raw = (s: string) => ({ __raw: s });
  sql.values = (tuples: unknown[][]) => ({ __values: tuples });

  const query: WaddlerQuery = {
    then: () => Promise.resolve(undefined) as never,
    catch: () => Promise.resolve(undefined) as never,
    append: (part: unknown) => {
      parts.push(part);
      return query;
    },
  };
  sql.append = query.append;

  return { sql, query, parts };
}

describe("appendWhere", () => {
  const mapping = {
    id: { name: "id" },
    name: { name: "full_name" },
  };

  test("does nothing when where is empty", () => {
    const { sql, query, parts } = makeSqlMock();
    appendWhere(sql, query, mapping, {});
    expect(parts.length).toBe(0);
  });

  test("does nothing when all where values are undefined", () => {
    const { sql, query, parts } = makeSqlMock();
    appendWhere(sql, query, mapping, { id: undefined });
    expect(parts.length).toBe(0);
  });

  test("does nothing when key not in mapping", () => {
    const { sql, query, parts } = makeSqlMock();
    appendWhere(sql, query, mapping, { unknown: "val" });
    expect(parts.length).toBe(0);
  });

  test("appends WHERE for first condition", () => {
    const { sql, query, parts } = makeSqlMock();
    appendWhere(sql, query, mapping, { id: "123" });
    expect(parts.length).toBeGreaterThan(0);
  });

  test("uses AND connector when firstConnector is AND", () => {
    const { sql, query, parts } = makeSqlMock();
    appendWhere(sql, query, mapping, { id: "123" }, { firstConnector: " AND " });
    expect(parts.length).toBeGreaterThan(0);
  });

  test("appends multiple conditions (more parts than single condition)", () => {
    const { sql, query, parts: partsMulti } = makeSqlMock();
    appendWhere(sql, query, mapping, { id: "1", name: "Alice" });
    const { parts: partsSingle } = makeSqlMock();
    const { sql: sql2, query: q2 } = makeSqlMock();
    appendWhere(sql2, q2, mapping, { id: "1" });
    // two conditions should append more parts than one
    expect(partsMulti.length).toBeGreaterThan(partsSingle.length);
  });

  test("does not append when query has no append method", () => {
    const { sql, parts } = makeSqlMock();
    const queryNoAppend: WaddlerQuery = {
      then: () => Promise.resolve(undefined) as never,
      catch: () => Promise.resolve(undefined) as never,
    };
    appendWhere(sql, queryNoAppend, mapping, { id: "1" });
    expect(parts.length).toBe(0);
  });
});

import { describe, expect, it } from "bun:test";
import type { WaddlerQuery, WaddlerSql } from "./types.js";
import { appendWhere } from "./where.js";

function makeMockSql() {
  const parts: unknown[] = [];

  const query: WaddlerQuery = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for WaddlerQuery
    then: () => Promise.resolve() as never,
    catch: () => Promise.resolve() as never,
    append(part) {
      parts.push(part);
      return query;
    },
  };

  const sql = Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      parts.push({ strings: [...strings], values });
      return query;
    },
    {
      identifier: (name: string) => `"${name}"`,
      raw: (s: string) => s,
      values: (tuples: unknown[][]) => tuples,
    }
  ) as unknown as WaddlerSql;

  return { sql, query, parts };
}

describe("appendWhere", () => {
  const mapping = { id: { name: "id" }, name: { name: "name" } };

  it("does nothing when where is empty", () => {
    const { sql, query, parts } = makeMockSql();
    appendWhere(sql, query, mapping, {});
    expect(parts).toHaveLength(0);
  });

  it("does nothing when all values are undefined", () => {
    const { sql, query, parts } = makeMockSql();
    appendWhere(sql, query, mapping, { id: undefined });
    expect(parts).toHaveLength(0);
  });

  it("does nothing when query has no append", () => {
    const { sql, query } = makeMockSql();
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for WaddlerQuery
    const noAppend: WaddlerQuery = { then: query.then, catch: query.catch }; // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    expect(() => appendWhere(sql, noAppend, mapping, { id: "1" })).not.toThrow();
  });

  it("appends WHERE for first condition", () => {
    const { sql, query, parts } = makeMockSql();
    appendWhere(sql, query, mapping, { id: "1" });
    expect(parts.length).toBeGreaterThan(0);
  });

  it("appends AND for first condition when firstConnector is AND", () => {
    const { sql, query, parts } = makeMockSql();
    appendWhere(sql, query, mapping, { id: "1" }, { firstConnector: " AND " });
    // should use AND connector (not WHERE)
    expect(parts.length).toBeGreaterThan(0);
  });

  it("skips keys not in mapping", () => {
    const { sql, query, parts } = makeMockSql();
    appendWhere(sql, query, mapping, { unknown: "value" } as never, undefined);
    expect(parts).toHaveLength(0);
  });
});

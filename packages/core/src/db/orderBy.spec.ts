import { describe, expect, it } from "bun:test";
import { appendOrderBy } from "./orderBy.js";
import type { WaddlerQuery, WaddlerSql } from "./types.js";

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
      const result = { strings: [...strings], values };
      parts.push(result);
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

describe("appendOrderBy", () => {
  const mapping = { id: { name: "id" }, name: { name: "name" } };

  it("does nothing when orderBy is empty", () => {
    const { sql, query, parts } = makeMockSql();
    appendOrderBy(sql, query, mapping, {});
    expect(parts).toHaveLength(0);
  });

  it("does nothing when all keys are not in mapping", () => {
    const { sql, query, parts } = makeMockSql();
    appendOrderBy(sql, query, mapping, { unknown: "asc" } as never);
    expect(parts).toHaveLength(0);
  });

  it("does nothing when query has no append", () => {
    const { sql, query } = makeMockSql();
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for WaddlerQuery
    const noAppend: WaddlerQuery = { then: query.then, catch: query.catch };
    expect(() => appendOrderBy(sql, noAppend, mapping, { id: "asc" })).not.toThrow();
  });

  it("appends ORDER BY for a single column", () => {
    const { sql, query, parts } = makeMockSql();
    appendOrderBy(sql, query, mapping, { id: "asc" });
    expect(parts.length).toBeGreaterThan(0);
  });

  it("appends ORDER BY for multiple columns", () => {
    const { sql, query, parts } = makeMockSql();
    appendOrderBy(sql, query, mapping, { id: "asc", name: "desc" });
    expect(parts.length).toBeGreaterThan(0);
  });
});

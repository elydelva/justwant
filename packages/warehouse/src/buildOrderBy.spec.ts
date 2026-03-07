import { describe, expect, test } from "bun:test";
import { appendOrderBy } from "./buildOrderBy.js";
import type { WaddlerQuery, WaddlerSql } from "./types.js";

function createMockSql(): {
  sql: WaddlerSql;
  parts: unknown[];
} {
  const parts: unknown[] = [];
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = {
      // biome-ignore lint/suspicious/noThenProperty: mock thenable for tests
      then: (fn?: (v: unknown) => unknown) => Promise.resolve(parts).then(fn),
      catch: (fn?: (v: unknown) => unknown) => Promise.reject(parts).catch(fn),
      append: (part: unknown) => {
        parts.push(part);
        return query;
      },
    } as WaddlerQuery;
    return query;
  }) as WaddlerSql;
  sql.identifier = (name: string | { schema?: string; table: string; column?: string }) =>
    typeof name === "string" ? `"${name}"` : `"${name.table}"`;
  sql.raw = (s: string) => s;
  sql.values = (tuples: unknown[][]) => tuples;
  return { sql, parts };
}

describe("appendOrderBy", () => {
  test("does nothing when orderBy keys not in mapping", () => {
    const { sql, parts } = createMockSql();
    const query = sql`SELECT * FROM t` as WaddlerQuery;
    (query as { append?: (p: unknown) => WaddlerQuery }).append = (p) => {
      parts.push(p);
      return query;
    };
    appendOrderBy(sql, query, { a: { name: "col_a" } }, { unknown_key: "asc" });
    expect(parts).toHaveLength(0);
  });

  test("appends ORDER BY for valid mapping", () => {
    const { sql, parts } = createMockSql();
    const query = sql`SELECT * FROM t` as WaddlerQuery;
    (query as { append?: (p: unknown) => WaddlerQuery }).append = (p) => {
      parts.push(p);
      return query;
    };
    appendOrderBy(
      sql,
      query,
      { event_type: { name: "event_type" } },
      {
        event_type: "desc",
      }
    );
    expect(parts.length).toBeGreaterThan(0);
  });

  test("does nothing when orderBy is empty", () => {
    const { sql, parts } = createMockSql();
    const query = sql`SELECT * FROM t` as WaddlerQuery;
    (query as { append?: (p: unknown) => WaddlerQuery }).append = (p) => {
      parts.push(p);
      return query;
    };
    appendOrderBy(sql, query, { a: { name: "col_a" } }, {});
    expect(parts).toHaveLength(0);
  });
});

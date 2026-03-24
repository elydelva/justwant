import { describe, expect, test } from "bun:test";
import { appendOrderBy } from "./buildOrderBy.js";
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

describe("appendOrderBy", () => {
  const mapping = {
    name: { name: "full_name" },
    createdAt: { name: "created_at" },
  };

  test("does nothing when orderBy is empty", () => {
    const { sql, query, parts } = makeSqlMock();
    appendOrderBy(sql, query, mapping, {});
    expect(parts.length).toBe(0);
  });

  test("does nothing when keys not in mapping", () => {
    const { sql, query, parts } = makeSqlMock();
    appendOrderBy(sql, query, mapping, { unknown: "asc" });
    expect(parts.length).toBe(0);
  });

  test("appends ORDER BY for single column", () => {
    const { sql, query, parts } = makeSqlMock();
    appendOrderBy(sql, query, mapping, { name: "asc" });
    expect(parts.length).toBeGreaterThan(0);
    // ORDER BY raw is appended via query.append
    const rawParts = parts.filter(
      (p) => typeof p === "object" && p !== null && "__raw" in (p as object)
    ) as { __raw: string }[];
    expect(rawParts.some((p) => p.__raw === " ORDER BY ")).toBe(true);
  });

  test("appends DESC for desc direction", () => {
    const { sql, query, parts } = makeSqlMock();
    appendOrderBy(sql, query, mapping, { name: "desc" });
    // DESC is embedded in template values
    const templateParts = parts.filter(
      (p) => typeof p === "object" && p !== null && "values" in (p as object)
    ) as { values: unknown[] }[];
    const hasDesc = templateParts.some((p) =>
      p.values.some((v) => typeof v === "object" && v !== null && "__raw" in v && (v as { __raw: string }).__raw === "DESC")
    );
    expect(hasDesc).toBe(true);
  });

  test("appends ASC for asc direction", () => {
    const { sql, query, parts } = makeSqlMock();
    appendOrderBy(sql, query, mapping, { name: "asc" });
    const templateParts = parts.filter(
      (p) => typeof p === "object" && p !== null && "values" in (p as object)
    ) as { values: unknown[] }[];
    const hasAsc = templateParts.some((p) =>
      p.values.some((v) => typeof v === "object" && v !== null && "__raw" in v && (v as { __raw: string }).__raw === "ASC")
    );
    expect(hasAsc).toBe(true);
  });

  test("appends comma separator for multiple columns", () => {
    const { sql, query, parts } = makeSqlMock();
    appendOrderBy(sql, query, mapping, { name: "asc", createdAt: "desc" });
    const rawParts = parts.filter(
      (p) => typeof p === "object" && p !== null && "__raw" in (p as object)
    ) as { __raw: string }[];
    expect(rawParts.some((p) => p.__raw === ", ")).toBe(true);
  });

  test("does not append when query has no append method", () => {
    const { sql, parts } = makeSqlMock();
    const queryNoAppend: WaddlerQuery = {
      then: () => Promise.resolve(undefined) as never,
      catch: () => Promise.resolve(undefined) as never,
    };
    appendOrderBy(sql, queryNoAppend, mapping, { name: "asc" });
    expect(parts.length).toBe(0);
  });
});

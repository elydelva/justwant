import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/contract";
import type { BoundQuery, MappedTable, MappedTableInternal } from "./table.js";

function createBoundQuery<T>(result: T): BoundQuery<T> {
  return {
    get _result() {
      return undefined as T;
    },
    async execute() {
      return result;
    },
  };
}

describe("BoundQuery", () => {
  test("execute returns the result", async () => {
    const q = createBoundQuery({ id: "1" });
    const result = await q.execute();
    expect(result).toEqual({ id: "1" });
  });

  test("execute returns null for findById not found", async () => {
    const q = createBoundQuery<{ id: string } | null>(null);
    const result = await q.execute();
    expect(result).toBeNull();
  });
});

describe("MappedTable", () => {
  test("exposes infer, contract, and _internal", () => {
    const UserContract = defineContract({
      id: field<string>().required(),
      email: field<string>().required(),
    });

    const mockSql = {
      findById: () => createBoundQuery<{ id: string; email: string } | null>(null),
      findOne: () => createBoundQuery<{ id: string; email: string } | null>(null),
      findMany: () => createBoundQuery<{ id: string; email: string }[]>([]),
      create: () => createBoundQuery({ id: "1", email: "a@b.com" }),
      update: () => createBoundQuery({ id: "1", email: "a@b.com" }),
      delete: () => createBoundQuery<void>(undefined),
      hardDelete: () => createBoundQuery<void>(undefined),
    };

    const internal: MappedTableInternal<typeof UserContract> = {
      contract: UserContract,
      sql: mockSql,
    };

    const table: MappedTable<typeof UserContract> = {
      get infer() {
        return undefined as { id: string; email: string };
      },
      contract: UserContract,
      _internal: internal,
    };

    expect(table.contract).toBe(UserContract);
    expect(table._internal).toBe(internal);
    expect(table._internal.sql.findById).toBeDefined();
    expect(table._internal.sql.hardDelete).toBeDefined();
  });
});

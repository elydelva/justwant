import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/contract";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { defineMappedTable } from "./defineMappedTable.js";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
  name: field<string>().optional(),
});

const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
});

const mapping = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
};

describe("defineMappedTable", () => {
  test("returns object with contract, _internal, and infer", () => {
    const mapped = defineMappedTable(usersTable, UserContract, mapping);
    expect(mapped.contract).toBe(UserContract);
    expect(mapped._internal).toBeDefined();
    expect(mapped._internal.contract).toBe(UserContract);
    expect(mapped._internal.source).toBe(usersTable);
    expect(mapped._internal.mapping).toBe(mapping);
    expect(mapped._internal.tableName).toBe("users");
    expect(mapped.infer).toBeUndefined();
  });

  test("sql methods throw until used via createDrizzleAdapter", () => {
    const mapped = defineMappedTable(usersTable, UserContract, mapping);
    const msg = "defineMappedTable: use createDrizzleAdapter to create a fully configured adapter";

    expect(() => mapped._internal.sql.findById("1")).toThrow(msg);
    expect(() => mapped._internal.sql.findOne({ email: "a@b.com" })).toThrow(msg);
    expect(() => mapped._internal.sql.findMany({})).toThrow(msg);
    expect(() => mapped._internal.sql.create({ email: "a@b.com" })).toThrow(msg);
    expect(() => mapped._internal.sql.update("1", { name: "x" })).toThrow(msg);
    expect(() => mapped._internal.sql.delete("1")).toThrow(msg);
    expect(() => mapped._internal.sql.hardDelete("1")).toThrow(msg);
  });

  test("accepts softDeleteColumn option", () => {
    const mapped = defineMappedTable(usersTable, UserContract, mapping, {
      softDeleteColumn: "deleted_at",
    });
    expect(mapped._internal.tableName).toBe("users");
  });

  test("accepts softDeleteColumn null to disable", () => {
    const mapped = defineMappedTable(usersTable, UserContract, mapping, {
      softDeleteColumn: null,
    });
    expect(mapped._internal.tableName).toBe("users");
  });
});

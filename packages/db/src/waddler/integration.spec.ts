/**
 * E2E integration test with real Waddler + Bun SQLite.
 * Full CRUD flow, findMany, and edge cases.
 */
import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/contract";
import { createWaddlerAdapter } from "./core.js";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
  name: field<string>().optional(),
});

const mapping = {
  id: { name: "id" },
  email: { name: "email" },
  name: { name: "name" },
};

describe("adapter-waddler integration (real Waddler + Bun SQLite)", () => {
  test("full CRUD: create, findById, findMany, update, delete", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const id = `e2e-${Date.now()}`;

    const created = await users._internal.sql
      .create({ id, email: `${id}@test.com`, name: "E2E User" })
      .execute();

    expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    const found = await users._internal.sql.findById(id).execute();
    expect(found).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    const updated = await users._internal.sql.update(id, { name: "E2E Updated" }).execute();
    expect(updated).toMatchObject({ id, name: "E2E Updated" });

    const rows = await users._internal.sql.findMany({ email: `${id}@test.com` }).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id, name: "E2E Updated" });

    await users._internal.sql.hardDelete(id).execute();

    const afterDelete = await users._internal.sql.findById(id).execute();
    expect(afterDelete).toBeNull();
  });

  test("findMany returns matching rows", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const id1 = `e2e-a-${Date.now()}`;
    const id2 = `e2e-b-${Date.now()}`;

    await users._internal.sql.create({ id: id1, email: "findmany@test.com", name: "A" }).execute();
    await users._internal.sql.create({ id: id2, email: "findmany@test.com", name: "B" }).execute();

    const rows = await users._internal.sql.findMany({ email: "findmany@test.com" }).execute();

    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.some((r) => r.id === id1)).toBe(true);
    expect(rows.some((r) => r.id === id2)).toBe(true);

    await users._internal.sql.hardDelete(id1).execute();
    await users._internal.sql.hardDelete(id2).execute();
  });

  test("adapter.sql allows raw queries", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });

    const result = await adapter.sql`SELECT 1 as one`;
    const rows = Array.isArray(result) ? result : ((result as { rows?: unknown[] })?.rows ?? []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ one: 1 });
  });
});

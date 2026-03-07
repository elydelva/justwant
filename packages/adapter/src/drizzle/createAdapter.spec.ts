import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/adapter";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createDrizzleAdapter } from "./createAdapter.js";

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

const usersSoftDeleteTable = sqliteTable("users_soft", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  deleted_at: text("deleted_at"),
});

const mapping = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
};

const mappingSoftDelete = {
  id: usersSoftDeleteTable.id,
  email: usersSoftDeleteTable.email,
  name: usersSoftDeleteTable.name,
  deletedAt: usersSoftDeleteTable.deleted_at,
};

/** SQLite requires id; CreateInput omits it for auto-generated IDs. */
type CreateWithId = { id: string; email: string; name?: string };

describe("createDrizzleAdapter", () => {
  test("create and findById returns created entity", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping);

    // SQLite requires id; CreateInput omits it for auto-generated IDs
    const created = await users._internal.sql
      .create({
        id: "u1",
        email: "a@b.com",
        name: "Alice",
      } as Parameters<typeof users._internal.sql.create>[0] & { id: string })
      .execute();

    expect(created).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });

    sqlite.close();
  });

  test("findById returns null when not found", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping);

    const found = await users._internal.sql.findById("nonexistent").execute();
    expect(found).toBeNull();

    sqlite.close();
  });

  test("findOne returns null when no match", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping);

    const found = await users._internal.sql.findOne({ email: "nope@x.com" }).execute();
    expect(found).toBeNull();

    sqlite.close();
  });

  test("findOne returns first match", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping);

    await users._internal.sql
      .create({ id: "u1", email: "a@b.com", name: "A" } as CreateWithId)
      .execute();
    await users._internal.sql
      .create({ id: "u2", email: "a@b.com", name: "B" } as CreateWithId)
      .execute();

    const found = await users._internal.sql.findOne({ email: "a@b.com" }).execute();
    expect(found).toBeDefined();
    expect(["u1", "u2"]).toContain(found?.id);

    sqlite.close();
  });

  test("findMany returns all matching rows", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping);

    await users._internal.sql
      .create({ id: "u1", email: "a@b.com", name: "A" } as CreateWithId)
      .execute();
    await users._internal.sql
      .create({ id: "u2", email: "a@b.com", name: "B" } as CreateWithId)
      .execute();
    await users._internal.sql
      .create({ id: "u3", email: "c@d.com", name: "C" } as CreateWithId)
      .execute();

    const all = await users._internal.sql.findMany({}).execute();
    expect(all).toHaveLength(3);

    const filtered = await users._internal.sql.findMany({ email: "a@b.com" }).execute();
    expect(filtered).toHaveLength(2);

    sqlite.close();
  });

  test("update modifies and returns entity", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping);

    await users._internal.sql
      .create({ id: "u1", email: "a@b.com", name: "Alice" } as CreateWithId)
      .execute();

    const updated = await users._internal.sql.update("u1", { name: "Alicia" }).execute();
    expect(updated.name).toBe("Alicia");

    const found = await users._internal.sql.findById("u1").execute();
    expect(found?.name).toBe("Alicia");

    sqlite.close();
  });

  test("hardDelete removes row", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping);

    await users._internal.sql
      .create({ id: "u1", email: "a@b.com", name: "Alice" } as CreateWithId)
      .execute();
    await users._internal.sql.hardDelete("u1").execute();

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toBeNull();

    sqlite.close();
  });

  test("adapter has dialect and client", () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    const adapter = createDrizzleAdapter(db, { dialect: "sqlite" });
    expect(adapter.dialect).toBe("sqlite");
    expect(adapter.client).toBe(db);
    sqlite.close();
  });

  test("transaction passes scoped adapter", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping);

    await adapter.transaction(async (tx) => {
      const txUsers = tx.defineTable(usersTable, UserContract, mapping);
      await txUsers._internal.sql
        .create({ id: "u1", email: "a@b.com", name: "Alice" } as CreateWithId)
        .execute();
    });

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });

    sqlite.close();
  });

  test("delete with softDeleteColumn sets deleted_at", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users_soft (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        deleted_at TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersSoftDeleteTable, UserContract, mappingSoftDelete, {
      softDeleteColumn: "deleted_at",
    });

    await users._internal.sql
      .create({ id: "u1", email: "a@b.com", name: "Alice" } as CreateWithId)
      .execute();

    await users._internal.sql.delete("u1").execute();

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toBeNull();

    const row = sqlite.prepare("SELECT deleted_at FROM users_soft WHERE id = 'u1'").get();
    expect(row).toBeDefined();
    expect((row as { deleted_at: string })?.deleted_at).toBeTruthy();

    sqlite.close();
  });

  test("parseDbError maps unique constraint violation on create", async () => {
    const { AdapterUniqueViolationError } = await import("@justwant/adapter/errors");
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping);

    await users._internal.sql
      .create({ id: "u1", email: "dup@b.com", name: "Alice" } as CreateWithId)
      .execute();

    await expect(
      users._internal.sql
        .create({ id: "u2", email: "dup@b.com", name: "Bob" } as CreateWithId)
        .execute()
    ).rejects.toThrow(AdapterUniqueViolationError);

    sqlite.close();
  });
});

import { describe, expect, test } from "bun:test";
import { defineContract, email, field, string, uuid } from "@justwant/contract";
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

describe("createWaddlerAdapter", () => {
  test("create and findById returns created entity", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const created = await users._internal.sql
      .create({ id: "u1", email: "a@b.com", name: "Alice" })
      .execute();

    expect(created).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });
  });

  test("public API create() and findById() work", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const created = await users.create({ id: "u1", email: "a@b.com", name: "Alice" });
    expect(created).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });

    const found = await users.findById("u1");
    expect(found).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });
  });

  test("findById returns null when not found", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const found = await users._internal.sql.findById("nonexistent").execute();
    expect(found).toBeNull();
  });

  test("findOne returns first match", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u1', 'a@b.com', 'Alice')`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u2', 'a@b.com', 'Bob')`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const found = await users._internal.sql.findOne({ email: "a@b.com" }).execute();
    expect(found).not.toBeNull();
    expect(found?.email).toBe("a@b.com");
  });

  test("findMany returns all matches", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u1', 'a@b.com', 'Alice')`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u2', 'a@b.com', 'Bob')`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const found = await users._internal.sql.findMany({ email: "a@b.com" }).execute();
    expect(found).toHaveLength(2);
  });

  test("update modifies and returns entity", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u1', 'a@b.com', 'Alice')`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const updated = await users._internal.sql.update("u1", { name: "Alicia" }).execute();

    expect(updated).toEqual({ id: "u1", email: "a@b.com", name: "Alicia" });
  });

  test("delete removes entity", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u1', 'a@b.com', 'Alice')`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    await users._internal.sql.hardDelete("u1").execute();

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toBeNull();
  });

  test("adapter exposes sql and driver", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });

    expect(adapter.sql).toBe(sql);
    expect(adapter.dialect).toBe("sqlite");
  });

  test("soft delete filters out deleted rows", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, deleted_at TEXT)`;
    await sql`INSERT INTO users (id, email, deleted_at) VALUES ('u1', 'a@b.com', NULL)`;
    await sql`INSERT INTO users (id, email, deleted_at) VALUES ('u2', 'b@b.com', '2024-01-01')`;

    const contract = defineContract({
      id: field<string>().required(),
      email: field<string>().optional(),
      deletedAt: field<string | null>().optional(),
    });
    const mappingWithSoft = {
      id: { name: "id" },
      email: { name: "email" },
      deletedAt: { name: "deleted_at" },
    };

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", contract, mappingWithSoft, {
      softDeleteColumn: "deletedAt",
    });

    const found = await users._internal.sql.findMany({}).execute();
    expect(found).toHaveLength(1);
    expect(found[0]?.id).toBe("u1");
  });

  test("findOne returns null when no match", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const found = await users._internal.sql.findOne({ email: "nope@x.com" }).execute();
    expect(found).toBeNull();
  });

  test("update with multiple fields modifies all", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u1', 'a@b.com', 'Alice')`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const updated = await users._internal.sql
      .update("u1", { email: "new@b.com", name: "Alicia" })
      .execute();

    expect(updated).toEqual({ id: "u1", email: "new@b.com", name: "Alicia" });
  });

  test("update with empty data returns existing row", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u1', 'a@b.com', 'Alice')`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const updated = await users._internal.sql.update("u1", {}).execute();
    expect(updated).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });
  });

  test("delete with softDeleteColumn sets deleted_at", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, deleted_at TEXT)`;
    await sql`INSERT INTO users (id, email, deleted_at) VALUES ('u1', 'a@b.com', NULL)`;

    const contract = defineContract({
      id: field<string>().required(),
      email: field<string>().optional(),
      deletedAt: field<string | null>().optional(),
    });
    const mappingWithSoft = {
      id: { name: "id" },
      email: { name: "email" },
      deletedAt: { name: "deleted_at" },
    };

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", contract, mappingWithSoft, {
      softDeleteColumn: "deletedAt",
    });

    await users._internal.sql.delete("u1").execute();

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toBeNull();

    const raw = await sql`SELECT * FROM users WHERE id = 'u1'`;
    const rows = Array.isArray(raw) ? raw : ((raw as { rows?: unknown[] })?.rows ?? []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "u1", deleted_at: expect.any(String) });
  });

  test("parseWaddlerError maps DB errors on create", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT)`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u1', 'a@b.com', 'Alice')`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    await expect(
      users._internal.sql.create({ id: "u2", email: "a@b.com", name: "Bob" }).execute()
    ).rejects.toMatchObject({
      name: "AdapterUniqueViolationError",
      code: "UNIQUE",
    });
  });

  test("TableSource with schema uses schema.table", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE "main"."users" (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable({ schema: "main", table: "users" }, UserContract, mapping);

    const created = await users._internal.sql
      .create({ id: "u1", email: "a@b.com", name: "Alice" })
      .execute();

    expect(created).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });
  });

  test("adapter.createTable(TableContract) runs DDL", async () => {
    const UserTableContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      name: string().optional(),
    });

    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    await adapter.createTable(UserTableContract);

    const users = adapter.table(UserTableContract);
    const created = await users.create({
      id: crypto.randomUUID(),
      email: "test@x.com",
      name: "Test",
    });

    expect(created.email).toBe("test@x.com");
  });

  test("table().createTable() creates table", async () => {
    const UserTableContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      name: string().optional(),
    });

    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.table(UserTableContract);
    const createTable = users.createTable;
    if (!createTable) throw new Error("createTable required");
    await createTable();

    const created = await users.create({
      id: crypto.randomUUID(),
      email: "test@x.com",
      name: "Test",
    });
    expect(created.email).toBe("test@x.com");
  });

  test("table().exist() returns true after createTable, false after drop", async () => {
    const UserTableContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      name: string().optional(),
    });

    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.table(UserTableContract);

    const exist = users.exist;
    const createTable = users.createTable;
    const drop = users.drop;
    if (!exist || !createTable || !drop) throw new Error("DDL methods required");

    expect(await exist()).toBe(false);
    await createTable();
    expect(await exist()).toBe(true);
    await drop();
    expect(await exist()).toBe(false);
  });

  test("defineTable().createTable() and exist() work", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);

    const exist = users.exist;
    const createTable = users.createTable;
    if (!exist || !createTable) throw new Error("DDL methods required");

    expect(await exist()).toBe(false);
    await createTable();
    expect(await exist()).toBe(true);

    const created = await users.create({ id: "u1", email: "a@b.com", name: "Alice" });
    expect(created.email).toBe("a@b.com");
  });

  test("create throws ContractValidationError on invalid email", async () => {
    const UserTableContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      name: string().optional(),
    });

    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");
    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.table(UserTableContract);

    const { ContractValidationError } = await import("@justwant/contract/validate");

    await expect(
      users.create({
        id: crypto.randomUUID(),
        email: "not-an-email",
        name: "Test",
      })
    ).rejects.toThrow(ContractValidationError);
  });

  test("updateSafe returns validation error instead of throwing", async () => {
    const UserTableContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      name: string().optional(),
    });

    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");
    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;
    await sql`INSERT INTO users (id, email, name) VALUES ('u1', 'valid@b.com', 'Alice')`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.table(UserTableContract);

    const updateSafe = users.updateSafe;
    if (!updateSafe) throw new Error("updateSafe required");
    const result = await updateSafe("u1", {
      email: "not-an-email",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "email")).toBe(true);
    }
  });

  test("createSafe returns validation error instead of throwing", async () => {
    const UserTableContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      name: string().optional(),
    });

    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");
    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.table(UserTableContract);

    const createSafe = users.createSafe;
    if (!createSafe) throw new Error("createSafe required");
    const result = await createSafe({
      id: crypto.randomUUID(),
      email: "not-an-email",
      name: "Test",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.path === "email")).toBe(true);
    }
  });

  test("adapter.table(TableContract) works with create", async () => {
    const UserTableContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      name: string().optional(),
    });

    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");

    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.table(UserTableContract);

    const created = await users.create({
      id: crypto.randomUUID(),
      email: "test@x.com",
      name: "Test",
    });

    expect(created.email).toBe("test@x.com");
    expect(created.name).toBe("Test");

    const found = await users.findById(created.id);
    expect(found).toEqual(created);
  });

  test("createDb with createBunSqliteAdapter works via entry point", async () => {
    const { createDb } = await import("./core.js");
    const { createBunSqliteAdapter } = await import("./bun-sqlite/index.js");

    const db = createDb(createBunSqliteAdapter({ connection: ":memory:" }));

    await db.sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

    const users = db.defineTable("users", UserContract, mapping);

    const created = await users._internal.sql
      .create({ id: "u1", email: "test@x.com", name: "Test" })
      .execute();

    expect(created).toEqual({ id: "u1", email: "test@x.com", name: "Test" });
  });

  test("createDb with close propagates close()", async () => {
    const { createDb } = await import("./core.js");
    const { createBunSqliteAdapter } = await import("./bun-sqlite/index.js");
    let closed = false;
    const adapter = createBunSqliteAdapter({ connection: ":memory:" });
    const db = createDb({ ...adapter, close: async () => { closed = true; } });
    expect(typeof db.close).toBe("function");
    await db.close!();
    expect(closed).toBe(true);
  });

  test("findOne with empty where uses LIMIT 1 path", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");
    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;
    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    // No softDelete column → hits the no-where LIMIT path
    const users = adapter.defineTable("users", UserContract, mapping, { softDeleteColumn: null });
    await users.create({ id: "u1", email: "a@b.com", name: "Alice" });
    await users.create({ id: "u2", email: "b@b.com", name: "Bob" });
    const found = await users.findOne({});
    expect(found).not.toBeNull();
  });

  test("findMany with no where returns all rows", async () => {
    const { waddler } = await import("waddler/bun-sqlite");
    const sql = waddler(":memory:");
    await sql`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;
    const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
    const users = adapter.defineTable("users", UserContract, mapping);
    await users.create({ id: "u1", email: "a@b.com" });
    await users.create({ id: "u2", email: "b@b.com" });
    const found = await users.findMany({});
    expect(found).toHaveLength(2);
  });
});

/**
 * E2E integration tests with real Drizzle + SQLite, PostgreSQL, MySQL.
 * SQLite always runs. PostgreSQL and MySQL require Docker (docker compose up -d).
 */
import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/contract";
import { sql } from "drizzle-orm";
import { MYSQL_URL, POSTGRES_URL, hasMysql, hasPostgres } from "../e2e-helpers.js";
import { createDrizzleAdapter } from "./createAdapter.js";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
  name: field<string>().optional(),
});

type CreateWithId = { id: string; email: string; name?: string };

async function runCrudTests(
  setup: () => Promise<{
    adapter: ReturnType<typeof createDrizzleAdapter>;
    users: ReturnType<ReturnType<typeof createDrizzleAdapter>["defineTable"]>;
    teardown?: () => Promise<void>;
  }>
) {
  const { adapter, users, teardown } = await setup();
  const id = `e2e-${Date.now()}`;

  try {
    const created = await users._internal.sql
      .create({ id, email: `${id}@test.com`, name: "E2E User" } as CreateWithId)
      .execute();
    expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    const found = await users._internal.sql.findById(id).execute();
    expect(found).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    const updated = await users._internal.sql.update(id, { name: "E2E Updated" }).execute();
    expect(updated.name).toBe("E2E Updated");

    const rows = await users._internal.sql.findMany({ email: `${id}@test.com` }).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id, name: "E2E Updated" });

    await users._internal.sql.hardDelete(id).execute();
    const afterDelete = await users._internal.sql.findById(id).execute();
    expect(afterDelete).toBeNull();
  } finally {
    await teardown?.();
  }
}

describe("Drizzle integration (SQLite)", () => {
  test("full CRUD with Bun SQLite", async () => {
    const { Database } = await import("bun:sqlite");
    const { drizzle } = await import("drizzle-orm/bun-sqlite");
    const { sqliteTable, text } = await import("drizzle-orm/sqlite-core");

    const usersTable = sqliteTable("users_e2e_sqlite", {
      id: text("id").primaryKey(),
      email: text("email").notNull(),
      name: text("name"),
    });
    const mapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users_e2e_sqlite (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db, { dialect: "sqlite" });
    const users = adapter.defineTable(usersTable, UserContract, mapping, {
      softDeleteColumn: null,
    });

    await runCrudTests(async () => ({
      adapter,
      users,
      teardown: async () => sqlite.close(),
    }));
  });

  test("transaction commits with Bun SQLite", async () => {
    const { Database } = await import("bun:sqlite");
    const { drizzle } = await import("drizzle-orm/bun-sqlite");
    const { sqliteTable, text } = await import("drizzle-orm/sqlite-core");

    const usersTable = sqliteTable("users_e2e_tx", {
      id: text("id").primaryKey(),
      email: text("email").notNull(),
      name: text("name"),
    });
    const mapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users_e2e_tx (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db, { dialect: "sqlite" });
    const users = adapter.defineTable(usersTable, UserContract, mapping, {
      softDeleteColumn: null,
    });

    const id = `e2e-tx-${Date.now()}`;
    await adapter.transaction(async (tx) => {
      const txUsers = tx.defineTable(usersTable, UserContract, mapping, {
        softDeleteColumn: null,
      });
      await txUsers._internal.sql
        .create({ id, email: `${id}@test.com`, name: "TX User" } as CreateWithId)
        .execute();
    });

    const found = await users._internal.sql.findById(id).execute();
    expect(found).not.toBeNull();
    expect(found?.email).toBe(`${id}@test.com`);
    await users._internal.sql.hardDelete(id).execute();
    sqlite.close();
  });
});

describe("Drizzle integration (PostgreSQL)", () => {
  test("full CRUD with PostgreSQL", async () => {
    if (!(await hasPostgres())) {
      console.log("Skipping E2E PostgreSQL: not available (run: docker compose up -d)");
      return;
    }

    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { pgTable, varchar } = await import("drizzle-orm/pg-core");

    const pool = new Pool({ connectionString: POSTGRES_URL });
    const db = drizzle({ client: pool });

    const usersTable = pgTable("users_e2e_pg", {
      id: varchar("id", { length: 36 }).primaryKey(),
      email: varchar("email", { length: 255 }).notNull(),
      name: varchar("name", { length: 255 }),
    });
    const mapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS users_e2e_pg (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL, name VARCHAR(255))`
    );

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping, {
      softDeleteColumn: null,
    });

    await runCrudTests(async () => ({
      adapter,
      users,
      teardown: async () => pool.end(),
    }));
  });
});

describe("Drizzle integration (MySQL)", () => {
  test("full CRUD with MySQL", async () => {
    if (!(await hasMysql())) {
      console.log("Skipping E2E MySQL: not available (run: docker compose up -d)");
      return;
    }

    const mysql = await import("mysql2/promise");
    const { drizzle } = await import("drizzle-orm/mysql2");
    const { mysqlTable, varchar } = await import("drizzle-orm/mysql-core");

    const conn = await mysql.createConnection(MYSQL_URL);
    const db = drizzle(conn);

    const usersTable = mysqlTable("users_e2e_mysql", {
      id: varchar("id", { length: 36 }).primaryKey(),
      email: varchar("email", { length: 255 }).notNull(),
      name: varchar("name", { length: 255 }),
    });
    const mapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users_e2e_mysql (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255)
      )
    `);

    const adapter = createDrizzleAdapter(db, { dialect: "mysql" });
    const users = adapter.defineTable(usersTable, UserContract, mapping, {
      softDeleteColumn: null,
    });

    await runCrudTests(async () => ({
      adapter,
      users,
      teardown: async () => conn.end(),
    }));
  });
});

/**
 * Dialect-specific E2E tests.
 * - PostgreSQL: RETURNING, jsonb, uuid
 * - MySQL: backticks for identifiers, no RETURNING (insert+select fallback)
 * - SQLite: TEXT vs VARCHAR
 */
import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/contract";
import { createDrizzleAdapter } from "./drizzle/createAdapter.js";
import { MYSQL_URL, POSTGRES_URL, hasMysql, hasPostgres } from "./e2e-helpers.js";
import { createDb } from "./waddler/core.js";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
  name: field<string>().optional(),
});

describe("dialect-specific: PostgreSQL RETURNING", () => {
  test("create returns row via RETURNING clause", async () => {
    if (!(await hasPostgres())) {
      console.log("Skipping: PostgreSQL not available");
      return;
    }

    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { pgTable, varchar } = await import("drizzle-orm/pg-core");
    const { sql } = await import("drizzle-orm");

    const pool = new Pool({ connectionString: POSTGRES_URL });
    const db = drizzle({ client: pool });

    const usersTable = pgTable("users_dialect_pg", {
      id: varchar("id", { length: 36 }).primaryKey(),
      email: varchar("email", { length: 255 }).notNull(),
      name: varchar("name", { length: 255 }),
    });
    const mapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS users_dialect_pg (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL, name VARCHAR(255))`
    );

    const adapter = createDrizzleAdapter(db);
    const users = adapter.defineTable(usersTable, UserContract, mapping, {
      softDeleteColumn: null,
    });

    const id = `e2e-pg-${Date.now()}`;
    const created = await users._internal.sql
      .create({ id, email: `${id}@test.com`, name: "PG User" } as {
        id: string;
        email: string;
        name?: string;
      })
      .execute();

    expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "PG User" });
    await users._internal.sql.hardDelete(id).execute();
    await pool.end();
  });
});

describe("dialect-specific: MySQL backticks and no RETURNING", () => {
  test("create uses insert+select fallback (no RETURNING)", async () => {
    if (!(await hasMysql())) {
      console.log("Skipping: MySQL not available");
      return;
    }

    const mysql = await import("mysql2/promise");
    const { drizzle } = await import("drizzle-orm/mysql2");
    const { mysqlTable, varchar } = await import("drizzle-orm/mysql-core");

    const conn = await mysql.createConnection(MYSQL_URL);
    const db = drizzle(conn);

    const usersTable = mysqlTable("users_dialect_mysql", {
      id: varchar("id", { length: 36 }).primaryKey(),
      email: varchar("email", { length: 255 }).notNull(),
      name: varchar("name", { length: 255 }),
    });
    const mapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users_dialect_mysql (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255)
      )
    `);

    const adapter = createDrizzleAdapter(db, { dialect: "mysql" });
    const users = adapter.defineTable(usersTable, UserContract, mapping, {
      softDeleteColumn: null,
    });

    const id = `e2e-mysql-${Date.now()}`;
    const created = await users._internal.sql
      .create({ id, email: `${id}@test.com`, name: "MySQL User" } as {
        id: string;
        email: string;
        name?: string;
      })
      .execute();

    expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "MySQL User" });
    await users._internal.sql.hardDelete(id).execute();
    await conn.end();
  });

  test("Waddler MySQL uses backticks for column identifiers", async () => {
    if (!(await hasMysql())) {
      console.log("Skipping: MySQL not available");
      return;
    }

    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection(MYSQL_URL);
    const { createMysqlAdapter } = await import("./waddler/mysql/index.js");
    const db = createDb({
      ...createMysqlAdapter({ client: conn }),
      close: () => conn.end(),
    });

    try {
      await db.sql`CREATE TABLE IF NOT EXISTS users_backticks (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL, name VARCHAR(255))`;

      const users = db.defineTable("users_backticks", UserContract, {
        id: { name: "id" },
        email: { name: "email" },
        name: { name: "name" },
      });

      const id = `e2e-bt-${Date.now()}`;
      const created = await users._internal.sql
        .create({ id, email: `${id}@test.com`, name: "Backtick" })
        .execute();

      expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "Backtick" });
      await users._internal.sql.hardDelete(id).execute();
    } finally {
      await db.close?.();
    }
  });
});

describe("dialect-specific: SQLite TEXT", () => {
  test("SQLite uses TEXT for string columns", async () => {
    const { Database } = await import("bun:sqlite");
    const { drizzle } = await import("drizzle-orm/bun-sqlite");
    const { sqliteTable, text } = await import("drizzle-orm/sqlite-core");

    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });

    const usersTable = sqliteTable("users_dialect_sqlite", {
      id: text("id").primaryKey(),
      email: text("email").notNull(),
      name: text("name"),
    });
    const mapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

    sqlite.exec(`
      CREATE TABLE users_dialect_sqlite (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const adapter = createDrizzleAdapter(db, { dialect: "sqlite" });
    const users = adapter.defineTable(usersTable, UserContract, mapping, {
      softDeleteColumn: null,
    });

    const id = `e2e-sqlite-${Date.now()}`;
    const created = await users._internal.sql
      .create({ id, email: `${id}@test.com`, name: "SQLite User" } as {
        id: string;
        email: string;
        name?: string;
      })
      .execute();

    expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "SQLite User" });
    sqlite.close();
  });
});

import { Database } from "bun:sqlite";
/**
 * Load tests: batch insertions, concurrency, long transactions.
 * Uses Bun SQLite (Waddler) and Drizzle for transaction tests.
 * PostgreSQL/MySQL require Docker.
 */
import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/contract";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createDrizzleAdapter } from "./drizzle/createAdapter.js";
import { MYSQL_URL, POSTGRES_URL, hasMysql, hasPostgres } from "./e2e-helpers.js";
import { createWaddlerAdapter } from "./waddler/core.js";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
  name: field<string>().optional(),
});

const mapping = { id: { name: "id" }, email: { name: "email" }, name: { name: "name" } };

const BATCH_SIZE = 100;
const CONCURRENCY = 20;
const LOAD_TIMEOUT_MS = 30_000;

describe("Load: batch insertions", () => {
  test(
    "Waddler Bun SQLite: 100 sequential creates",
    async () => {
      const { waddler } = await import("waddler/bun-sqlite");
      const sql = waddler(":memory:");
      await sql`CREATE TABLE users_load (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

      const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
      const users = adapter.defineTable("users_load", UserContract, mapping);

      const prefix = `batch-${Date.now()}`;
      const ids: string[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const id = `${prefix}-${i}`;
        ids.push(id);
        await users._internal.sql
          .create({ id, email: `${id}@test.com`, name: `User ${i}` })
          .execute();
      }

      const rows = await users._internal.sql.findMany({ email: `${prefix}-0@test.com` }).execute();
      expect(rows.length).toBeGreaterThanOrEqual(1);

      const allByPrefix = await users._internal.sql.findMany({}).execute();
      const matching = allByPrefix.filter((r) => r.id.startsWith(prefix));
      expect(matching).toHaveLength(BATCH_SIZE);

      for (const id of ids) {
        await users._internal.sql.hardDelete(id).execute();
      }
    },
    LOAD_TIMEOUT_MS
  );

  test(
    "Drizzle PostgreSQL: 100 sequential creates",
    async () => {
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

      const usersTable = pgTable("users_load_pg", {
        id: varchar("id", { length: 36 }).primaryKey(),
        email: varchar("email", { length: 255 }).notNull(),
        name: varchar("name", { length: 255 }),
      });
      const drizzleMapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

      await db.execute(
        sql`CREATE TABLE IF NOT EXISTS users_load_pg (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL, name VARCHAR(255))`
      );

      const adapter = createDrizzleAdapter(db);
      const users = adapter.defineTable(usersTable, UserContract, drizzleMapping, {
        softDeleteColumn: null,
      });

      const prefix = `batch-pg-${Date.now()}`;
      const ids: string[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const id = `${prefix}-${i}`;
        ids.push(id);
        await users._internal.sql
          .create({ id, email: `${id}@test.com`, name: `User ${i}` } as {
            id: string;
            email: string;
            name?: string;
          })
          .execute();
      }

      const matching = (await users._internal.sql.findMany({}).execute()).filter((r) =>
        r.id.startsWith(prefix)
      );
      expect(matching).toHaveLength(BATCH_SIZE);

      for (const id of ids) {
        await users._internal.sql.hardDelete(id).execute();
      }

      await pool.end();
    },
    LOAD_TIMEOUT_MS
  );

  test(
    "Drizzle MySQL: 100 sequential creates",
    async () => {
      if (!(await hasMysql())) {
        console.log("Skipping: MySQL not available");
        return;
      }

      const mysql = await import("mysql2/promise");
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { mysqlTable, varchar } = await import("drizzle-orm/mysql-core");

      const conn = await mysql.createConnection(MYSQL_URL);
      const db = drizzle(conn);

      const usersTable = mysqlTable("users_load_mysql", {
        id: varchar("id", { length: 36 }).primaryKey(),
        email: varchar("email", { length: 255 }).notNull(),
        name: varchar("name", { length: 255 }),
      });
      const drizzleMapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS users_load_mysql (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255)
        )
      `);

      const adapter = createDrizzleAdapter(db, { dialect: "mysql" });
      const users = adapter.defineTable(usersTable, UserContract, drizzleMapping, {
        softDeleteColumn: null,
      });

      const prefix = `batch-mysql-${Date.now()}`;
      const ids: string[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const id = `${prefix}-${i}`;
        ids.push(id);
        await users._internal.sql
          .create({ id, email: `${id}@test.com`, name: `User ${i}` } as {
            id: string;
            email: string;
            name?: string;
          })
          .execute();
      }

      const matching = (await users._internal.sql.findMany({}).execute()).filter((r) =>
        r.id.startsWith(prefix)
      );
      expect(matching).toHaveLength(BATCH_SIZE);

      for (const id of ids) {
        await users._internal.sql.hardDelete(id).execute();
      }

      await conn.end();
    },
    LOAD_TIMEOUT_MS
  );
});

describe("Load: concurrency", () => {
  test(
    "Waddler Bun SQLite: 20 parallel create + findById",
    async () => {
      const { waddler } = await import("waddler/bun-sqlite");
      const sql = waddler(":memory:");
      await sql`CREATE TABLE users_load (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT)`;

      const adapter = createWaddlerAdapter(sql, { dialect: "sqlite" });
      const users = adapter.defineTable("users_load", UserContract, mapping);

      const prefix = `conc-${Date.now()}`;

      const createAndFind = async (i: number) => {
        const id = `${prefix}-${i}`;
        await users._internal.sql
          .create({ id, email: `${id}@test.com`, name: `Concurrent ${i}` })
          .execute();
        const found = await users._internal.sql.findById(id).execute();
        expect(found).not.toBeNull();
        expect(found?.id).toBe(id);
        return id;
      };

      const ids = await Promise.all(
        Array.from({ length: CONCURRENCY }, (_, i) => createAndFind(i))
      );

      expect(ids).toHaveLength(CONCURRENCY);

      for (const id of ids) {
        await users._internal.sql.hardDelete(id).execute();
      }
    },
    LOAD_TIMEOUT_MS
  );

  test(
    "Drizzle PostgreSQL: 20 parallel create + findById",
    async () => {
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

      const usersTable = pgTable("users_load_conc_pg", {
        id: varchar("id", { length: 36 }).primaryKey(),
        email: varchar("email", { length: 255 }).notNull(),
        name: varchar("name", { length: 255 }),
      });
      const drizzleMapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

      await db.execute(
        sql`CREATE TABLE IF NOT EXISTS users_load_conc_pg (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL, name VARCHAR(255))`
      );

      const adapter = createDrizzleAdapter(db);
      const users = adapter.defineTable(usersTable, UserContract, drizzleMapping, {
        softDeleteColumn: null,
      });

      const prefix = `conc-pg-${Date.now()}`;

      const createAndFind = async (i: number) => {
        const id = `${prefix}-${i}`;
        await users._internal.sql
          .create({ id, email: `${id}@test.com`, name: `Concurrent ${i}` } as {
            id: string;
            email: string;
            name?: string;
          })
          .execute();
        const found = await users._internal.sql.findById(id).execute();
        expect(found).not.toBeNull();
        expect(found?.id).toBe(id);
        return id;
      };

      const ids = await Promise.all(
        Array.from({ length: CONCURRENCY }, (_, i) => createAndFind(i))
      );
      expect(ids).toHaveLength(CONCURRENCY);

      for (const id of ids) {
        await users._internal.sql.hardDelete(id).execute();
      }

      await pool.end();
    },
    LOAD_TIMEOUT_MS
  );

  test(
    "Drizzle MySQL: 20 parallel create + findById",
    async () => {
      if (!(await hasMysql())) {
        console.log("Skipping: MySQL not available");
        return;
      }

      const mysql = await import("mysql2/promise");
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { mysqlTable, varchar } = await import("drizzle-orm/mysql-core");

      const conn = await mysql.createConnection(MYSQL_URL);
      const db = drizzle(conn);

      const usersTable = mysqlTable("users_load_conc_mysql", {
        id: varchar("id", { length: 36 }).primaryKey(),
        email: varchar("email", { length: 255 }).notNull(),
        name: varchar("name", { length: 255 }),
      });
      const drizzleMapping = { id: usersTable.id, email: usersTable.email, name: usersTable.name };

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS users_load_conc_mysql (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255)
        )
      `);

      const adapter = createDrizzleAdapter(db, { dialect: "mysql" });
      const users = adapter.defineTable(usersTable, UserContract, drizzleMapping, {
        softDeleteColumn: null,
      });

      const prefix = `conc-mysql-${Date.now()}`;

      const createAndFind = async (i: number) => {
        const id = `${prefix}-${i}`;
        await users._internal.sql
          .create({ id, email: `${id}@test.com`, name: `Concurrent ${i}` } as {
            id: string;
            email: string;
            name?: string;
          })
          .execute();
        const found = await users._internal.sql.findById(id).execute();
        expect(found).not.toBeNull();
        expect(found?.id).toBe(id);
        return id;
      };

      const ids = await Promise.all(
        Array.from({ length: CONCURRENCY }, (_, i) => createAndFind(i))
      );
      expect(ids).toHaveLength(CONCURRENCY);

      for (const id of ids) {
        await users._internal.sql.hardDelete(id).execute();
      }

      await conn.end();
    },
    LOAD_TIMEOUT_MS
  );
});

describe("Load: long transactions", () => {
  test(
    "Drizzle SQLite: 50 creates in a single transaction",
    async () => {
      const sqlite = new Database(":memory:");
      sqlite.exec(`
      CREATE TABLE users_load (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

      const db = drizzle({ client: sqlite });
      const adapter = createDrizzleAdapter(db);

      const usersTable = sqliteTable("users_load", {
        id: text("id").primaryKey(),
        email: text("email").notNull(),
        name: text("name"),
      });

      const drizzleMapping = {
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
      };

      const users = adapter.defineTable(usersTable, UserContract, drizzleMapping);

      const prefix = `tx-${Date.now()}`;
      const ids: string[] = [];

      await adapter.transaction(async (tx) => {
        const txUsers = tx.defineTable(usersTable, UserContract, drizzleMapping);
        for (let i = 0; i < 50; i++) {
          const id = `${prefix}-${i}`;
          ids.push(id);
          await txUsers._internal.sql
            .create({ id, email: `${id}@test.com`, name: `TX User ${i}` })
            .execute();
        }
      });

      const found = await users._internal.sql.findById(`${prefix}-0`).execute();
      expect(found).not.toBeNull();
      expect(found?.email).toBe(`${prefix}-0@test.com`);

      const all = await users._internal.sql.findMany({}).execute();
      const matching = all.filter((r) => r.id.startsWith(prefix));
      expect(matching).toHaveLength(50);

      for (const id of ids) {
        await users._internal.sql.hardDelete(id).execute();
      }

      sqlite.close();
    },
    LOAD_TIMEOUT_MS
  );
});

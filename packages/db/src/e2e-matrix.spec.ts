/**
 * E2E matrix: shared scenarios run across Waddler dialects.
 * Uses runE2EMatrix() for CRUD, transaction, unique violation.
 */
import { describe, test } from "bun:test";
import { defineContract, field } from "@justwant/contract";
import { MYSQL_URL, POSTGRES_URL, hasMysql, hasPostgres } from "./e2e-helpers.js";
import {
  type E2EAdapterContext,
  runE2EMatrix,
  scenarioCrud,
  scenarioTransaction,
  scenarioUniqueViolation,
} from "./e2e-matrix.js";
import { createDb, createWaddlerAdapter } from "./waddler/core.js";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
  name: field<string>().optional(),
});

const mapping = { id: { name: "id" }, email: { name: "email" }, name: { name: "name" } };

function toContext(
  users: { _internal: { sql: unknown } },
  adapter: { dialect: string; transaction?: (fn: (tx: unknown) => Promise<void>) => Promise<void> },
  teardown?: () => Promise<void>
): E2EAdapterContext {
  const sql = users._internal.sql as {
    create: (d: unknown) => {
      execute: () => Promise<{ id: string; email: string; name?: string }>;
    };
    findById: (id: string) => {
      execute: () => Promise<{ id: string; email: string; name?: string } | null>;
    };
    update: (
      id: string,
      d: unknown
    ) => { execute: () => Promise<{ id: string; email: string; name?: string }> };
    findMany: (w: unknown) => {
      execute: () => Promise<{ id: string; email: string; name?: string }[]>;
    };
    hardDelete: (id: string) => { execute: () => Promise<void> };
  };
  return {
    dialect: adapter.dialect as "sqlite" | "pg" | "mysql",
    create: (d) => sql.create(d).execute(),
    findById: (id) => sql.findById(id).execute(),
    update: (id, d) => sql.update(id, d).execute(),
    findMany: (w) => sql.findMany(w).execute(),
    hardDelete: (id) => sql.hardDelete(id).execute(),
    transaction: undefined,
    teardown,
  };
}

const setups = [
  {
    name: "Waddler Bun SQLite",
    available: async () => true,
    create: async (): Promise<E2EAdapterContext> => {
      const { waddler } = await import("waddler/bun-sqlite");
      const sql = waddler(":memory:");
      await sql`CREATE TABLE users_matrix (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT)`;
      const db = createWaddlerAdapter(sql, { dialect: "sqlite" });
      const users = db.defineTable("users_matrix", UserContract, mapping);
      return toContext(users, db);
    },
  },
  {
    name: "Waddler PGLite",
    available: async () => true,
    create: async (): Promise<E2EAdapterContext> => {
      const { createPgliteAdapter } = await import("./waddler/pglite/index.js");
      const { PGlite } = await import("@electric-sql/pglite");
      const pglite = new PGlite();
      const db = createDb(createPgliteAdapter({ client: pglite }));
      await db.sql`CREATE TABLE users_matrix (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, name VARCHAR(255))`;
      const users = db.defineTable("users_matrix", UserContract, mapping);
      return toContext(users, db);
    },
  },
  {
    name: "Waddler PostgreSQL",
    available: hasPostgres,
    create: async (): Promise<E2EAdapterContext> => {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: POSTGRES_URL });
      const { createPgAdapter } = await import("./waddler/pg/index.js");
      const db = createDb({
        ...createPgAdapter({ client: pool }),
        close: () => pool.end(),
      });
      await db.sql`CREATE TABLE IF NOT EXISTS users_matrix (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, name VARCHAR(255))`;
      const users = db.defineTable("users_matrix", UserContract, mapping);
      return toContext(users, db, async () => {
        await db.close?.();
      });
    },
  },
  {
    name: "Waddler MySQL",
    available: hasMysql,
    create: async (): Promise<E2EAdapterContext> => {
      const mysql = await import("mysql2/promise");
      const conn = await mysql.createConnection(MYSQL_URL);
      const { createMysqlAdapter } = await import("./waddler/mysql/index.js");
      const db = createDb({
        ...createMysqlAdapter({ client: conn }),
        close: () => conn.end(),
      });
      await db.sql`CREATE TABLE IF NOT EXISTS users_matrix (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, name VARCHAR(255))`;
      const users = db.defineTable("users_matrix", UserContract, mapping);
      return toContext(users, db, async () => {
        await db.close?.();
      });
    },
  },
];

runE2EMatrix(
  setups,
  [
    { name: "full CRUD", fn: scenarioCrud },
    { name: "transaction commits", fn: scenarioTransaction },
    { name: "unique violation throws AdapterUniqueViolationError", fn: scenarioUniqueViolation },
  ],
  { describe, test }
);

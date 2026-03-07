import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { bulkInsert } from "./bulkInsert.js";

const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
});

describe("bulkInsert", () => {
  test("returns empty array for empty rows", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const result = await bulkInsert(db, usersTable, []);
    expect(result).toEqual([]);

    sqlite.close();
  });

  test("inserts multiple rows and returns them", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT
      )
    `);

    const rows = [
      { id: "u1", email: "a@b.com", name: "Alice" },
      { id: "u2", email: "b@c.com", name: "Bob" },
    ];
    const result = await bulkInsert(db, usersTable, rows);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "u1", email: "a@b.com", name: "Alice" });
    expect(result[1]).toMatchObject({ id: "u2", email: "b@c.com", name: "Bob" });

    sqlite.close();
  });
});

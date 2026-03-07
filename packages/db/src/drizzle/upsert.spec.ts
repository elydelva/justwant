import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { AdapterUnsupportedError } from "@justwant/db/errors";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { upsert } from "./upsert.js";

const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
});

describe("upsert", () => {
  test("throws AdapterUnsupportedError on SQLite", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });

    await expect(
      upsert(db, usersTable, { id: "u1", email: "a@b.com", name: "Alice" }, ["id"])
    ).rejects.toThrow(AdapterUnsupportedError);

    sqlite.close();
  });

  test("AdapterUnsupportedError has operation and dialect metadata", async () => {
    const sqlite = new Database(":memory:");
    const db = drizzle({ client: sqlite });

    try {
      await upsert(db, usersTable, { id: "u1", email: "a@b.com" }, ["id"]);
    } catch (err) {
      expect(err).toBeInstanceOf(AdapterUnsupportedError);
      expect((err as AdapterUnsupportedError).metadata?.operation).toBe("upsert");
    }

    sqlite.close();
  });

  test("PostgreSQL path calls insert().values().onConflictDoUpdate().returning()", async () => {
    const returned = [{ id: "u1", email: "a@b.com", name: "Alice" }];
    const mockDb = {
      dialect: { name: "pg" },
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: () => ({
            returning: () => Promise.resolve(returned),
          }),
        }),
      }),
    };
    const result = await upsert(
      mockDb as never,
      usersTable,
      { id: "u1", email: "a@b.com", name: "Alice" },
      ["id"]
    );
    expect(result).toEqual(returned);
  });
});

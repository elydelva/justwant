import { describe, expect, test } from "bun:test";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { collectSchemas } from "./collectSchemas.js";

const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
});

const postsTable = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  userId: text("user_id"),
});

describe("collectSchemas", () => {
  test("returns tables as-is", () => {
    const tables = { users: usersTable, posts: postsTable };
    const result = collectSchemas(tables);
    expect(result).toBe(tables);
    expect(result.users).toBe(usersTable);
    expect(result.posts).toBe(postsTable);
  });

  test("returns empty object for empty input", () => {
    const result = collectSchemas({});
    expect(result).toEqual({});
  });

  test("preserves table references", () => {
    const tables = { users: usersTable };
    const result = collectSchemas(tables);
    expect(Object.keys(result)).toEqual(["users"]);
    expect(result.users).toBe(usersTable);
  });
});

import { describe, expect, test } from "bun:test";
import { defineContract } from "@justwant/contract";
import { email, string, uuid } from "@justwant/contract/fields";
import { getCreateTableSQL } from "./index.js";

describe("getCreateTableSQL", () => {
  test("generates valid SQLite DDL", () => {
    const UserContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required().unique(),
      name: string().optional(),
    });

    const sql = getCreateTableSQL(UserContract, "sqlite");
    expect(sql).toContain('CREATE TABLE "users"');
    expect(sql).toContain('"id" TEXT NOT NULL PRIMARY KEY');
    expect(sql).toContain('"email" TEXT NOT NULL UNIQUE');
    expect(sql).toContain('"name" TEXT');
  });

  test("generates valid PG DDL", () => {
    const UserContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
    });

    const sql = getCreateTableSQL(UserContract, "pg");
    expect(sql).toContain('CREATE TABLE "users"');
    expect(sql).toContain('"id" TEXT NOT NULL PRIMARY KEY');
  });

  test("generates valid MySQL DDL", () => {
    const UserContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
    });

    const sql = getCreateTableSQL(UserContract, "mysql");
    expect(sql).toContain("CREATE TABLE `users`");
    // MySQL maps TEXT to VARCHAR(255)
    expect(sql).toContain("`id` VARCHAR(255) NOT NULL PRIMARY KEY");
  });
});

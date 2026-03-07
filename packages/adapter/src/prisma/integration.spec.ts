/**
 * E2E integration test with real Prisma + SQLite.
 * Requires: prisma generate, prisma db push. Uses absolute path to prisma/test.db.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL = `file:${resolve(__dirname, "../../prisma/test.db")}`;
import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/adapter";
import { PrismaClient } from "@prisma/client";
import { createPrismaAdapter } from "./createAdapter.js";

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

describe("adapter-prisma integration (real Prisma + SQLite)", () => {
  const prisma = new PrismaClient();
  const adapter = createPrismaAdapter(prisma, { dialect: "sqlite" });
  const users = adapter.defineTable("user", UserContract, mapping, {
    softDeleteColumn: null,
  });

  test("create and findById returns created entity", async () => {
    const id = `e2e-${Date.now()}`;
    const created = await users._internal.sql
      .create({ id, email: `${id}@test.com`, name: "E2E User" })
      .execute();

    expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    const found = await users._internal.sql.findById(id).execute();
    expect(found).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    await users._internal.sql.hardDelete(id).execute();
  });

  test("findMany returns matching rows", async () => {
    const id1 = `e2e-a-${Date.now()}`;
    const id2 = `e2e-b-${Date.now()}`;
    await users._internal.sql.create({ id: id1, email: "findmany@test.com", name: "A" }).execute();
    await users._internal.sql.create({ id: id2, email: "findmany@test.com", name: "B" }).execute();

    const rows = await users._internal.sql.findMany({ email: "findmany@test.com" }).execute();
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.some((r) => r.id === id1)).toBe(true);
    expect(rows.some((r) => r.id === id2)).toBe(true);

    await users._internal.sql.hardDelete(id1).execute();
    await users._internal.sql.hardDelete(id2).execute();
  });

  test("transaction commits", async () => {
    const id = `e2e-tx-${Date.now()}`;
    await adapter.transaction(async (tx) => {
      const txUsers = tx.defineTable("user", UserContract, mapping, {
        softDeleteColumn: null,
      });
      await txUsers._internal.sql
        .create({ id, email: `${id}@test.com`, name: "TX User" })
        .execute();
    });

    const found = await users._internal.sql.findById(id).execute();
    expect(found).not.toBeNull();
    expect(found?.email).toBe(`${id}@test.com`);

    await users._internal.sql.hardDelete(id).execute();
  });
});

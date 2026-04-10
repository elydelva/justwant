/**
 * E2E integration tests with real Prisma.
 * SQLite: always runs (prisma generate, prisma db push in pretest).
 * PostgreSQL, MySQL: require Docker + prisma generate for schema.postgres/mysql.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? `file:${resolve(__dirname, "../../prisma/test.db")}`;
import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/contract";
import { PrismaClient } from "@prisma/client";
import { MYSQL_URL, POSTGRES_URL, hasMysql, hasPostgres } from "../e2e-helpers.js";
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

describe("adapter-prisma integration (SQLite)", () => {
  let prisma: PrismaClient;
  try {
    prisma = new PrismaClient();
  } catch {
    console.log("Skipping E2E Prisma SQLite: client not generated (run: prisma generate)");
    test.skip("prisma not generated", () => {});
    // @ts-ignore
    return;
  }
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

describe("adapter-prisma integration (PostgreSQL)", () => {
  test("full CRUD with PostgreSQL", async () => {
    if (!(await hasPostgres())) {
      console.log("Skipping E2E Prisma PostgreSQL: not available (run: docker compose up -d)");
      return;
    }

    let PrismaClientPg: typeof PrismaClient;
    try {
      const mod = await import("../../generated/prisma-postgres/index.js");
      PrismaClientPg = mod.PrismaClient ?? mod.default;
    } catch {
      console.log(
        "Skipping E2E Prisma PostgreSQL: client not generated (run: prisma generate --schema=prisma/schema.postgres.prisma)"
      );
      return;
    }

    const prisma = new PrismaClientPg({ datasourceUrl: POSTGRES_URL });
    const adapter = createPrismaAdapter(prisma, { dialect: "pg" });
    const users = adapter.defineTable("User", UserContract, mapping, {
      softDeleteColumn: null,
    });

    const id = `e2e-${Date.now()}`;
    const created = await users._internal.sql
      .create({ id, email: `${id}@test.com`, name: "E2E User" })
      .execute();
    expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    const found = await users._internal.sql.findById(id).execute();
    expect(found).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    await users._internal.sql.hardDelete(id).execute();
    const afterDelete = await users._internal.sql.findById(id).execute();
    expect(afterDelete).toBeNull();

    await prisma.$disconnect();
  });
});

describe("adapter-prisma integration (MySQL)", () => {
  test("full CRUD with MySQL", async () => {
    if (!(await hasMysql())) {
      console.log("Skipping E2E Prisma MySQL: not available (run: docker compose up -d)");
      return;
    }

    let PrismaClientMysql: typeof PrismaClient;
    try {
      const mod = await import("../../generated/prisma-mysql/index.js");
      PrismaClientMysql = mod.PrismaClient ?? mod.default;
    } catch {
      console.log(
        "Skipping E2E Prisma MySQL: client not generated (run: prisma generate --schema=prisma/schema.mysql.prisma)"
      );
      return;
    }

    const prisma = new PrismaClientMysql({ datasourceUrl: MYSQL_URL });
    const adapter = createPrismaAdapter(prisma, { dialect: "mysql" });
    const users = adapter.defineTable("User", UserContract, mapping, {
      softDeleteColumn: null,
    });

    const id = `e2e-${Date.now()}`;
    const created = await users._internal.sql
      .create({ id, email: `${id}@test.com`, name: "E2E User" })
      .execute();
    expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    const found = await users._internal.sql.findById(id).execute();
    expect(found).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

    await users._internal.sql.hardDelete(id).execute();
    const afterDelete = await users._internal.sql.findById(id).execute();
    expect(afterDelete).toBeNull();

    await prisma.$disconnect();
  });
});

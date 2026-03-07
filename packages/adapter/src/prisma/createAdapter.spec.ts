import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/adapter";
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

function createMockPrismaClient() {
  const store = new Map<string, Record<string, unknown>>();

  const delegate = {
    findUnique: async (args: { where: Record<string, unknown> }) => {
      const id = args.where.id as string;
      const row = store.get(id);
      if (!row) return null;
      if (row.deletedAt != null) return null;
      return { ...row };
    },
    findFirst: async (args: { where?: Record<string, unknown> }) => {
      const where = args.where ?? {};
      for (const row of store.values()) {
        if (row.deletedAt != null) continue;
        let match = true;
        for (const [k, v] of Object.entries(where)) {
          const rowVal = row[k];
          const matches = v === null ? rowVal == null : rowVal === v;
          if (!matches) {
            match = false;
            break;
          }
        }
        if (match) return { ...row };
      }
      return null;
    },
    findMany: async (args: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, "asc" | "desc">;
      take?: number;
      skip?: number;
    }) => {
      const where = args.where ?? {};
      let results: Record<string, unknown>[] = [];
      for (const row of store.values()) {
        if (row.deletedAt != null) continue;
        let match = true;
        for (const [k, v] of Object.entries(where)) {
          const rowVal = row[k];
          const matches = v === null ? rowVal == null : rowVal === v;
          if (!matches) {
            match = false;
            break;
          }
        }
        if (match) results.push({ ...row });
      }
      if (args.orderBy) {
        const [key, dir] = Object.entries(args.orderBy)[0] ?? [];
        if (key) {
          results = [...results].sort((a, b) => {
            const aVal = a[key] as string | number;
            const bVal = b[key] as string | number;
            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return dir === "desc" ? -cmp : cmp;
          });
        }
      }
      const skip = args.skip ?? 0;
      const take = args.take ?? results.length;
      return results.slice(skip, skip + take);
    },
    create: async (args: { data: Record<string, unknown> }) => {
      const row = { ...args.data };
      store.set(row.id as string, row);
      return row;
    },
    update: async (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => {
      const id = args.where.id as string;
      const existing = store.get(id);
      if (!existing) throw new Error("Record not found");
      const updated = { ...existing, ...args.data };
      store.set(id, updated);
      return updated;
    },
    delete: async (args: { where: Record<string, unknown> }) => {
      const id = args.where.id as string;
      store.delete(id);
      return { id };
    },
  };

  const prisma = {
    user: delegate,
    $transaction: async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
  };

  return { prisma, store };
}

describe("createPrismaAdapter", () => {
  test("create and findById returns created entity", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping);

    const created = await users._internal.sql
      .create({ id: "u1", email: "a@b.com", name: "Alice" })
      .execute();

    expect(created).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });
  });

  test("findById returns null when not found", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping);

    const found = await users._internal.sql.findById("nonexistent").execute();
    expect(found).toBeNull();
  });

  test("findOne returns null when no match", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping);

    const found = await users._internal.sql.findOne({ email: "nope@x.com" }).execute();
    expect(found).toBeNull();
  });

  test("findOne returns first match", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping);

    await users._internal.sql.create({ id: "u1", email: "a@b.com", name: "A" }).execute();
    await users._internal.sql.create({ id: "u2", email: "a@b.com", name: "B" }).execute();

    const found = await users._internal.sql.findOne({ email: "a@b.com" }).execute();
    expect(found).toBeDefined();
    expect(["u1", "u2"]).toContain(found?.id);
  });

  test("findMany returns all matching rows", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping);

    await users._internal.sql.create({ id: "u1", email: "a@b.com", name: "A" }).execute();
    await users._internal.sql.create({ id: "u2", email: "a@b.com", name: "B" }).execute();
    await users._internal.sql.create({ id: "u3", email: "c@d.com", name: "C" }).execute();

    const all = await users._internal.sql.findMany({}).execute();
    expect(all).toHaveLength(3);

    const filtered = await users._internal.sql.findMany({ email: "a@b.com" }).execute();
    expect(filtered).toHaveLength(2);
  });

  test("update modifies and returns entity", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping);

    await users._internal.sql.create({ id: "u1", email: "a@b.com", name: "Alice" }).execute();

    const updated = await users._internal.sql.update("u1", { name: "Alicia" }).execute();
    expect(updated.name).toBe("Alicia");

    const found = await users._internal.sql.findById("u1").execute();
    expect(found?.name).toBe("Alicia");
  });

  test("hardDelete removes row", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping);

    await users._internal.sql.create({ id: "u1", email: "a@b.com", name: "Alice" }).execute();
    await users._internal.sql.hardDelete("u1").execute();

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toBeNull();
  });

  test("delete with softDeleteColumn updates deletedAt", async () => {
    const { prisma, store } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping, {
      softDeleteColumn: "deletedAt",
    });

    await users._internal.sql.create({ id: "u1", email: "a@b.com", name: "Alice" }).execute();
    await users._internal.sql.delete("u1").execute();

    const row = store.get("u1");
    expect(row?.deletedAt).toBeInstanceOf(Date);

    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toBeNull();
  });

  test("adapter has dialect and client", () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma, { dialect: "sqlite" });
    expect(adapter.dialect).toBe("sqlite");
    expect(adapter.client).toBe(prisma);
  });

  test("defineTable throws when model not found", () => {
    const prisma = { unknownModel: {} } as Record<string, unknown>;
    const adapter = createPrismaAdapter(prisma as Parameters<typeof createPrismaAdapter>[0]);
    expect(() => adapter.defineTable("nonexistent", UserContract, mapping)).toThrow(
      'Model "nonexistent" not found on PrismaClient'
    );
  });

  test("defineTable throws when mapping lacks id", () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const mappingWithoutId = { email: { name: "email" }, name: { name: "name" } };
    expect(() => adapter.defineTable("user", UserContract, mappingWithoutId)).toThrow(
      "Mapping must include 'id' field"
    );
  });

  test("findMany accepts orderBy, take, skip", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping);

    await users._internal.sql.create({ id: "u1", email: "a@b.com", name: "A" }).execute();
    await users._internal.sql.create({ id: "u2", email: "b@c.com", name: "B" }).execute();
    await users._internal.sql.create({ id: "u3", email: "c@d.com", name: "C" }).execute();

    const paginated = await users._internal.sql
      .findMany({}, { orderBy: { email: "asc" }, take: 2, skip: 1 })
      .execute();
    expect(paginated).toHaveLength(2);
  });

  test("findById and update accept PrismaId (string or number)", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    const users = adapter.defineTable("user", UserContract, mapping);

    await users._internal.sql.create({ id: "u1", email: "a@b.com", name: "Alice" }).execute();

    const found = await users._internal.sql.findById("u1").execute();
    expect(found?.id).toBe("u1");

    const updated = await users._internal.sql.update("u1", { name: "Alicia" }).execute();
    expect(updated.name).toBe("Alicia");
  });

  test("parsePrismaError maps Prisma errors on create", async () => {
    const { AdapterUniqueViolationError } = await import("@justwant/adapter/errors");
    const prisma = {
      user: {
        findUnique: async () => null,
        findFirst: async () => null,
        findMany: async () => [],
        create: async () => {
          throw { code: "P2002", message: "Unique constraint failed", meta: { target: ["email"] } };
        },
        update: async () => ({}),
        delete: async () => ({}),
      },
    };
    const adapter = createPrismaAdapter(prisma as Parameters<typeof createPrismaAdapter>[0]);
    const users = adapter.defineTable("user", UserContract, mapping);

    await expect(
      users._internal.sql.create({ id: "u1", email: "a@b.com" }).execute()
    ).rejects.toThrow(AdapterUniqueViolationError);
  });

  test("transaction passes scoped adapter", async () => {
    const { prisma } = createMockPrismaClient();
    const adapter = createPrismaAdapter(prisma);
    let txAdapter: ReturnType<typeof adapter.defineTable> | null = null;

    await adapter.transaction(async (tx) => {
      txAdapter = tx.defineTable("user", UserContract, mapping);
      await txAdapter._internal.sql.create({ id: "u1", email: "a@b.com", name: "Alice" }).execute();
    });

    const users = adapter.defineTable("user", UserContract, mapping);
    const found = await users._internal.sql.findById("u1").execute();
    expect(found).toEqual({ id: "u1", email: "a@b.com", name: "Alice" });
  });
});

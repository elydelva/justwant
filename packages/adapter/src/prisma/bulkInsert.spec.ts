import { describe, expect, test } from "bun:test";
import { bulkInsertPrisma } from "./bulkInsert.js";

describe("bulkInsertPrisma", () => {
  test("returns count 0 for empty rows", async () => {
    const delegate = { createMany: async () => ({ count: 0 }) };
    const result = await bulkInsertPrisma(delegate, []);
    expect(result).toEqual({ count: 0 });
  });

  test("calls delegate.createMany with data and returns count", async () => {
    const delegate = {
      createMany: async (args: { data: Record<string, unknown>[] }) => {
        expect(args.data).toHaveLength(2);
        expect(args.data[0]).toEqual({ id: "u1", email: "a@b.com" });
        expect(args.data[1]).toEqual({ id: "u2", email: "b@c.com" });
        return { count: 2 };
      },
    };

    const result = await bulkInsertPrisma(delegate, [
      { id: "u1", email: "a@b.com" },
      { id: "u2", email: "b@c.com" },
    ]);

    expect(result).toEqual({ count: 2 });
  });
});

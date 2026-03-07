import { describe, expect, test } from "bun:test";
import { upsertPrisma } from "./upsert.js";

describe("upsertPrisma", () => {
  test("calls delegate.upsert with where, create, update", async () => {
    let called = false;
    const delegate = {
      upsert: async (args: {
        where: Record<string, unknown>;
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        called = true;
        expect(args.where).toEqual({ email: "a@b.com" });
        expect(args.create).toEqual({ email: "a@b.com", name: "Alice" });
        expect(args.update).toEqual({ name: "Alicia" });
        return { id: "u1", email: "a@b.com", name: "Alicia" };
      },
    };

    const result = await upsertPrisma(
      delegate,
      { email: "a@b.com" },
      { email: "a@b.com", name: "Alice" },
      { name: "Alicia" }
    );

    expect(called).toBe(true);
    expect(result).toEqual({ id: "u1", email: "a@b.com", name: "Alicia" });
  });
});

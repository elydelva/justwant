import { describe, expect, test } from "bun:test";
import { buildPrismaWhere } from "./buildWhere.js";

const mapping = {
  id: { name: "id" },
  email: { name: "email" },
  name: { name: "name" },
};

describe("buildPrismaWhere", () => {
  test("returns empty object for empty where", () => {
    const result = buildPrismaWhere(mapping, {});
    expect(result).toEqual({});
  });

  test("filters out undefined values", () => {
    const result = buildPrismaWhere(mapping, {
      id: "1",
      email: undefined,
      name: undefined,
    });
    expect(result).toEqual({ id: "1" });
  });

  test("builds where for single key", () => {
    const result = buildPrismaWhere(mapping, { id: "1" });
    expect(result).toEqual({ id: "1" });
  });

  test("builds where for multiple keys", () => {
    const result = buildPrismaWhere(mapping, { id: "1", email: "a@b.com" });
    expect(result).toEqual({ id: "1", email: "a@b.com" });
  });

  test("uses mapping to map contract keys to field names", () => {
    const customMapping = {
      userId: { name: "user_id" },
      userEmail: { name: "user_email" },
    };
    const result = buildPrismaWhere(customMapping, {
      userId: "u1",
      userEmail: "a@b.com",
    });
    expect(result).toEqual({ user_id: "u1", user_email: "a@b.com" });
  });

  test("ignores keys not in mapping", () => {
    const result = buildPrismaWhere(mapping, {
      id: "1",
      unknownKey: "x",
    } as Record<string, unknown>);
    expect(result).toEqual({ id: "1" });
  });

  test("passes through Prisma filter objects", () => {
    const result = buildPrismaWhere(mapping, {
      email: { contains: "@" },
      name: { startsWith: "A" },
    } as Record<string, unknown>);
    expect(result).toEqual({
      email: { contains: "@" },
      name: { startsWith: "A" },
    });
  });

  test("passes through in operator", () => {
    const result = buildPrismaWhere(mapping, {
      id: { in: ["a", "b", "c"] },
    } as Record<string, unknown>);
    expect(result).toEqual({ id: { in: ["a", "b", "c"] } });
  });
});

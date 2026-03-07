import { describe, expect, test } from "bun:test";
import { defineContract, field } from "@justwant/contract";
import { mapRowToContract } from "./mapping.js";

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

describe("mapRowToContract", () => {
  test("maps row keys to contract keys using mapping", () => {
    const row = { id: "1", email: "a@b.com", name: "Alice" };
    const result = mapRowToContract<{ id: string; email: string; name?: string }>(
      row,
      mapping,
      UserContract
    );
    expect(result).toEqual({ id: "1", email: "a@b.com", name: "Alice" });
  });

  test("converts null to undefined for optional fields", () => {
    const row = { id: "1", email: "a@b.com", name: null };
    const result = mapRowToContract<{ id: string; email: string; name?: string }>(
      row,
      mapping,
      UserContract
    );
    expect(result).toEqual({ id: "1", email: "a@b.com", name: undefined });
  });

  test("preserves null for required fields (DB can return null)", () => {
    const row = { id: "1", email: null, name: "Alice" };
    const result = mapRowToContract<{ id: string; email: string; name?: string }>(
      row,
      mapping,
      UserContract
    );
    expect(result.email).toBe(null);
  });

  test("handles empty mapping", () => {
    const row = { id: "1" };
    const result = mapRowToContract<Record<string, unknown>>(row, {}, {});
    expect(result).toEqual({});
  });

  test("uses column name from mapping for row lookup", () => {
    const row = { user_id: "1", user_email: "x@y.com" };
    const customMapping = {
      id: { name: "user_id" },
      email: { name: "user_email" },
    };
    const result = mapRowToContract<{ id: string; email: string }>(row, customMapping, {
      id: field<string>().required(),
      email: field<string>().required(),
    } as ReturnType<typeof defineContract>);
    expect(result).toEqual({ id: "1", email: "x@y.com" });
  });
});

import { describe, expect, test } from "bun:test";
import { date, defineContract, number, string } from "@justwant/contract";
import { mapContractToRow, mapRowToContract } from "./mapping.js";

describe("mapRowToContract", () => {
  test("maps row to contract shape", () => {
    const contract = defineContract("events", {
      timestamp: date().required(),
      event_type: string().required(),
      amount: number().optional(),
    });
    const mapping = contract.mapping as Record<string, { name: string }>;
    const row = {
      timestamp: "2025-01-15T10:00:00.000Z",
      event_type: "purchase",
      amount: 99,
    };
    const result = mapRowToContract<{ timestamp: Date; event_type: string; amount?: number }>(
      row,
      mapping,
      contract.fields
    );
    expect(result.event_type).toBe("purchase");
    expect(result.amount).toBe(99);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  test("converts null to undefined for optional fields", () => {
    const contract = defineContract("t", {
      a: string().required(),
      b: number().optional(),
    });
    const mapping = contract.mapping as Record<string, { name: string }>;
    const row = { a: "x", b: null };
    const result = mapRowToContract<{ a: string; b?: number }>(row, mapping, contract.fields);
    expect(result.a).toBe("x");
    expect(result.b).toBeUndefined();
  });

  test("maps row with custom mapping back to contract shape", () => {
    const contract = defineContract(
      "events",
      { userId: string().required(), eventType: string().required() },
      { mapping: { userId: { name: "user_id" }, eventType: { name: "event_type" } } }
    );
    const mapping = contract.mapping as Record<string, { name: string }>;
    const row = { user_id: "u1", event_type: "purchase" };
    const result = mapRowToContract<{ userId: string; eventType: string }>(
      row,
      mapping,
      contract.fields
    );
    expect(result.userId).toBe("u1");
    expect(result.eventType).toBe("purchase");
  });
});

describe("mapContractToRow", () => {
  test("maps contract row to DB values", () => {
    const contract = defineContract("events", {
      timestamp: date().required(),
      event_type: string().required(),
      amount: number().optional(),
    });
    const mapping = contract.mapping as Record<string, { name: string }>;
    const row = {
      timestamp: new Date("2025-01-15T10:00:00.000Z"),
      event_type: "purchase",
      amount: 99,
    };
    const result = mapContractToRow(row, mapping);
    expect(result.timestamp).toBe("2025-01-15T10:00:00.000Z");
    expect(result.event_type).toBe("purchase");
    expect(result.amount).toBe(99);
  });

  test("skips keys not in row", () => {
    const contract = defineContract("t", { a: string().required(), b: number().optional() });
    const mapping = contract.mapping as Record<string, { name: string }>;
    const row = { a: "x" };
    const result = mapContractToRow(row, mapping);
    expect(result.a).toBe("x");
    expect("b" in result).toBe(false);
  });

  test("uses custom mapping for column names", () => {
    const contract = defineContract(
      "events",
      { userId: string().required(), eventType: string().required() },
      { mapping: { userId: { name: "user_id" }, eventType: { name: "event_type" } } }
    );
    const mapping = contract.mapping as Record<string, { name: string }>;
    const row = { userId: "u1", eventType: "purchase" };
    const result = mapContractToRow(row, mapping);
    expect(result.user_id).toBe("u1");
    expect(result.event_type).toBe("purchase");
  });
});

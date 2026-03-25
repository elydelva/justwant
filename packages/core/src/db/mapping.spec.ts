import { describe, expect, it } from "bun:test";
import { mapContractToRow, mapRowToContract } from "./mapping.js";

const contract = {
  id: { _required: true, _columnType: "TEXT" },
  name: { _required: false, _columnType: "TEXT" },
  score: { _required: true, _columnType: "REAL" },
  createdAt: { _required: false, _columnType: "TEXT" },
} as never;

const mapping = {
  id: { name: "id" },
  name: { name: "name" },
  score: { name: "score" },
  createdAt: { name: "created_at" },
};

describe("mapRowToContract", () => {
  it("maps column names to contract keys", () => {
    const row = { id: "1", name: "Alice", score: 9.5, created_at: null };
    const result = mapRowToContract<{
      id: string;
      name?: string;
      score: number;
      createdAt?: string;
    }>(row, mapping, contract);
    expect(result.id).toBe("1");
    expect(result.name).toBe("Alice");
    expect(result.score).toBe(9.5);
    expect(result.createdAt).toBeUndefined();
  });

  it("converts null to undefined for optional fields", () => {
    const row = { id: "1", name: null, score: 1, created_at: null };
    const result = mapRowToContract<Record<string, unknown>>(row, mapping, contract);
    expect(result.name).toBeUndefined();
    expect(result.createdAt).toBeUndefined();
  });

  it("converts ISO date strings to Date for TEXT fields", () => {
    const row = { id: "1", name: "x", score: 1, created_at: "2024-01-15T10:00:00.000Z" };
    const result = mapRowToContract<Record<string, unknown>>(row, mapping, contract);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("does not convert invalid date strings", () => {
    const row = { id: "1", name: "not-a-date", score: 1, created_at: null };
    const result = mapRowToContract<Record<string, unknown>>(row, mapping, contract);
    expect(result.name).toBe("not-a-date");
  });

  it("keeps null for required fields", () => {
    const row = { id: null, name: null, score: null, created_at: null };
    const result = mapRowToContract<Record<string, unknown>>(row, mapping, contract);
    expect(result.id).toBeNull();
    expect(result.score).toBeNull();
  });
});

describe("mapContractToRow", () => {
  it("maps contract keys to column names", () => {
    const row = { id: "1", name: "Alice", score: 9.5, createdAt: new Date("2024-01-15") };
    const result = mapContractToRow(row, mapping);
    expect(result.id).toBe("1");
    expect(result.name).toBe("Alice");
    expect(result.created_at).toBe(new Date("2024-01-15").toISOString());
  });

  it("converts Date to ISO string", () => {
    const d = new Date("2024-06-01T00:00:00.000Z");
    const result = mapContractToRow({ createdAt: d }, mapping);
    expect(result.created_at).toBe(d.toISOString());
  });

  it("skips keys not present in row", () => {
    const result = mapContractToRow({ id: "1" }, mapping);
    expect(Object.keys(result)).toEqual(["id"]);
  });
});

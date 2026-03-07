import { describe, expect, test } from "bun:test";
import { type InferContract, defineContract, field } from "./contract.js";

describe("field", () => {
  test("required returns FieldDef with _required true and _nullable false", () => {
    const def = field<string>().required();
    expect(def._required).toBe(true);
    expect(def._nullable).toBe(false);
  });

  test("optional returns FieldDef with _required false and _nullable true", () => {
    const def = field<number>().optional();
    expect(def._required).toBe(false);
    expect(def._nullable).toBe(true);
  });

  test("required preserves type via _type property", () => {
    const def = field<Date>().required();
    expect(def).toHaveProperty("_type");
  });

  test("optional preserves type via _type property", () => {
    const def = field<boolean>().optional();
    expect(def).toHaveProperty("_type");
  });
});

describe("defineContract", () => {
  test("returns the same object passed in", () => {
    const contract = {
      id: field<string>().required(),
      name: field<string>().optional(),
    };
    const result = defineContract(contract);
    expect(result).toBe(contract);
    expect(result.id).toBe(contract.id);
    expect(result.name).toBe(contract.name);
  });

  test("handles empty contract", () => {
    const result = defineContract({});
    expect(result).toEqual({});
  });
});

describe("InferContract", () => {
  test("infers required and optional fields correctly", () => {
    const UserContract = defineContract({
      id: field<string>().required(),
      email: field<string>().required(),
      name: field<string>().optional(),
    });

    type User = InferContract<typeof UserContract>;
    const _typeCheck: User = {
      id: "1",
      email: "a@b.com",
    };
    expect(_typeCheck.id).toBe("1");
    expect(_typeCheck.email).toBe("a@b.com");
    // Optional name can be omitted
    expect(_typeCheck.name).toBeUndefined();
  });

  test("optional field can be omitted", () => {
    const C = defineContract({
      a: field<string>().required(),
      b: field<number>().optional(),
    });
    type Inferred = InferContract<typeof C>;
    const valid: Inferred = { a: "x" };
    expect(valid.a).toBe("x");
    expect(valid.b).toBeUndefined();
  });
});

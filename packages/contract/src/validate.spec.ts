import { describe, expect, test } from "bun:test";
import { email, string, uuid } from "./fields.js";
import { ContractValidationError, type ValidationIssue, validateContractData } from "./validate.js";

const UserContract = {
  id: uuid().required(),
  email: email().required(),
  name: string().optional(),
};

describe("validateContractData", () => {
  test("returns ok when all fields with schema pass", () => {
    const result = validateContractData(
      { id: "550e8400-e29b-41d4-a716-446655440000", email: "a@b.com", name: "Alice" },
      UserContract
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("a@b.com");
      expect(result.value.name).toBe("Alice");
    }
  });

  test("returns ok when optional field is omitted", () => {
    const result = validateContractData(
      { id: "550e8400-e29b-41d4-a716-446655440000", email: "a@b.com" },
      UserContract
    );
    expect(result.ok).toBe(true);
  });

  test("returns issues when email is invalid", () => {
    const result = validateContractData(
      { id: "550e8400-e29b-41d4-a716-446655440000", email: "not-an-email", name: "Alice" },
      UserContract
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.path === "email")).toBe(true);
    }
  });

  test("returns issues when uuid is invalid", () => {
    const result = validateContractData({ id: "invalid-uuid", email: "a@b.com" }, UserContract);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "id")).toBe(true);
    }
  });

  test("with options.keys validates only specified keys", () => {
    const result = validateContractData({ name: "Alice" }, UserContract, { keys: ["name"] });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe("Alice");
  });

  test("skips keys not in data (partial update)", () => {
    const result = validateContractData({ name: "Bob" }, UserContract, {
      keys: ["name"],
    });
    expect(result.ok).toBe(true);
  });
});

describe("ContractValidationError", () => {
  test("message concatenates path and message for each issue", () => {
    const issues: ValidationIssue[] = [
      { path: "email", message: "Invalid email format" },
      { path: "id", message: "Invalid UUID format" },
    ];
    const err = new ContractValidationError(issues);
    expect(err.name).toBe("ContractValidationError");
    expect(err.issues).toEqual(issues);
    expect(err.message).toContain("email");
    expect(err.message).toContain("Invalid email format");
  });
});

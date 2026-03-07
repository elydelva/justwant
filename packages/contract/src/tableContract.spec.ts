import { describe, expect, test } from "bun:test";
import type { Infer, InferContract } from "./contract.js";
import { email, string, uuid } from "./fields.js";
import { defineContract } from "./tableContract.js";

describe("defineContract(tableName, fields)", () => {
  test("returns TableContract with tableName, fields, mapping", () => {
    const UserContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      name: string().optional(),
    });

    expect(UserContract.tableName).toBe("users");
    expect(UserContract.fields).toBeDefined();
    expect(UserContract.mapping).toEqual({
      id: { name: "id" },
      email: { name: "email" },
      name: { name: "name" },
    });
  });

  test("with defaultMapping camelToSnake", () => {
    const Contract = defineContract(
      "users",
      {
        id: uuid().required(),
        emailVerified: string().required(),
      },
      { defaultMapping: "camelToSnake" }
    );

    expect(Contract.mapping).toEqual({
      id: { name: "id" },
      emailVerified: { name: "email_verified" },
    });
  });

  test("InferContract works with TableContract (uses .fields)", () => {
    const UserContract = defineContract("users", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      name: string().optional(),
    });

    type User = InferContract<typeof UserContract>;
    const _typeCheck: User = {
      id: "u1",
      email: "a@b.com",
    };
    expect(_typeCheck.id).toBe("u1");
    expect(_typeCheck.email).toBe("a@b.com");
  });

  test("Infer alias works with TableContract", () => {
    const UserContract = defineContract("users", {
      id: uuid().required(),
      email: email().required(),
    });

    type User = Infer<typeof UserContract>;
    const _typeCheck: User = { id: "u1", email: "a@b.com" };
    expect(_typeCheck).toBeDefined();
  });

  test("supports default() on field builder", () => {
    const Contract = defineContract("items", {
      id: uuid().required().primaryKey(),
      status: string().default("'pending'").required(),
    });
    expect(Contract.fields.status._default).toBe("'pending'");
  });

  test("with partial mapping override", () => {
    const Contract = defineContract(
      "users",
      { id: uuid().required(), email: email().required() },
      { mapping: { email: { name: "user_email" } } }
    );

    expect(Contract.mapping).toEqual({
      id: { name: "id" },
      email: { name: "user_email" },
    });
  });
});

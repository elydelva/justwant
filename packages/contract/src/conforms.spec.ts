import { describe, expect, test } from "bun:test";
import { assertTableConforms, conformsTo, tableConforms } from "./conforms.js";
import { ContractConformityError } from "./errors.js";
import { email, string, uuid } from "./fields.js";
import { defineContract } from "./tableContract.js";

const WaitlistEntryContract = defineContract("waitlist_entries", {
  id: uuid().required().primaryKey(),
  email: email().required(),
  status: string().required(),
});

const UserContract = defineContract("users", {
  id: uuid().required().primaryKey(),
  email: email().required(),
  name: string().optional(),
});

describe("assertTableConforms", () => {
  test("passes when table has all required fields", () => {
    const mockTable = {
      contract: WaitlistEntryContract.fields,
    };

    expect(() => assertTableConforms(mockTable, WaitlistEntryContract)).not.toThrow();
  });

  test("passes when table has extra fields", () => {
    const extendedContract = defineContract("waitlist_entries", {
      id: uuid().required().primaryKey(),
      email: email().required(),
      status: string().required(),
      extraField: string().optional(),
    });

    const mockTable = {
      contract: extendedContract.fields,
    };

    expect(() => assertTableConforms(mockTable, WaitlistEntryContract)).not.toThrow();
  });

  test("throws when field is missing", () => {
    const partialContract = defineContract("partial", {
      id: uuid().required(),
      email: email().required(),
      // missing status
    });

    const mockTable = {
      contract: partialContract.fields,
    };

    expect(() => assertTableConforms(mockTable, WaitlistEntryContract)).toThrow(
      ContractConformityError
    );

    expect(() => assertTableConforms(mockTable, WaitlistEntryContract)).toThrow(
      /Missing field: status/
    );
  });

  test("accepts raw contract (not TableContract)", () => {
    const mockTable = {
      contract: UserContract.fields,
    };

    expect(() => assertTableConforms(mockTable, UserContract.fields)).not.toThrow();
  });
});

describe("tableConforms", () => {
  test("returns table typed as ConformableTable after runtime check", () => {
    const mockTable = {
      contract: WaitlistEntryContract.fields,
    };

    const typed = tableConforms(mockTable, WaitlistEntryContract);
    expect(typed).toBe(mockTable);
    expect(typed.contract).toEqual(WaitlistEntryContract.fields);
  });

  test("throws when table does not conform", () => {
    const partialContract = defineContract("partial", {
      id: uuid().required(),
      email: email().required(),
    });

    const mockTable = {
      contract: partialContract.fields,
    };

    expect(() => tableConforms(mockTable, WaitlistEntryContract)).toThrow(/Missing field: status/);
  });
});

describe("conformsTo", () => {
  test("is a no-op at runtime when types match", () => {
    const mockTable = {
      contract: WaitlistEntryContract.fields,
    };

    conformsTo(mockTable, WaitlistEntryContract);
    expect(mockTable).toBeDefined();
  });
});

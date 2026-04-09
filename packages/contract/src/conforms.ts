/**
 * Conformity checks for consuming libraries.
 * When a lib accepts a ConformableTable, it can verify the table's contract conforms
 * to the expected contract (compile-time via conformsTo, runtime via assertTableConforms).
 */

import type { AnyContract, FieldDef } from "./contract.js";
import { ContractConformityError } from "./errors.js";
import type { TableContract } from "./tableContract.js";

/**
 * Interface for tables that can be checked for contract conformity.
 * MappedTable from @justwant/db implements this.
 */
export interface ConformableTable {
  readonly contract: AnyContract;
}

/**
 * TTableContract conforms to TExpected if every required field of TExpected
 * exists in TTable with an assignable type.
 */
export type ConformsTo<
  TTableContract extends AnyContract,
  TExpectedContract extends AnyContract,
> = {
  [K in keyof TExpectedContract as TExpectedContract[K]["_required"] extends true
    ? K
    : never]: K extends keyof TTableContract
    ? TTableContract[K] extends FieldDef<infer T, boolean>
      ? TExpectedContract[K]["_type"] extends T
        ? true
        : false
      : false
    : false;
} extends Record<string, true>
  ? true
  : false;

/**
 * Compile-time assertion: table's contract conforms to expected.
 * Use before passing a table to a consuming lib that expects a specific contract.
 * Fails at compile time if non-conforming.
 */
export function conformsTo<TTable extends AnyContract, TExpected extends AnyContract>(
  _table: ConformsTo<TTable, TExpected> extends true ? ConformableTable : never,
  _expectedContract: TExpected | TableContract<TExpected>
): void {
  // compile-time only — no runtime behaviour needed
}

/**
 * Runtime assertion + cast: verifies table conforms to expected contract,
 * then returns table typed as ConformableTable with T["fields"].
 */
export function tableConforms<T extends TableContract<AnyContract>>(
  table: ConformableTable,
  expected: T
): ConformableTable & { contract: T["fields"] } {
  assertTableConforms(table, expected);
  return table as ConformableTable & { contract: T["fields"] };
}

/**
 * Runtime assertion: table's contract has all required fields of expected.
 * Throws ContractConformityError if a field is missing or required mismatch.
 */
export function assertTableConforms<TExpected extends AnyContract>(
  table: ConformableTable,
  expectedContract: TExpected | TableContract<TExpected>
): void {
  const expected =
    expectedContract && "fields" in expectedContract
      ? (expectedContract as TableContract<TExpected>).fields
      : expectedContract;

  const tableContract = table.contract;

  for (const key of Object.keys(expected)) {
    const expectedField = expected[key];
    const actual = tableContract[key];

    if (!actual) {
      throw new ContractConformityError(`Missing field: ${String(key)}`, [String(key)]);
    }
    if (expectedField?._required && !actual._required) {
      throw new ContractConformityError(`Field ${String(key)} must be required`);
    }
  }
}

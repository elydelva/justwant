/**
 * TableContract - defineContract(tableName, fields) without DDL.
 * DDL (getCreateTableSQL) lives in @justwant/db.
 */

import type { AnyContract, TableFields } from "./contract.js";

/** String mapping: contract key → column name. */
export type StringMapping<T extends Record<string, unknown>> = {
  [K in keyof T]: { name: string };
};

export type DefineContractOptions = {
  /** camelCase → snake_case for column names */
  defaultMapping?: "camelToSnake";
  /** Override mapping for specific keys */
  mapping?: Partial<Record<string, { name: string }>>;
};

function camelToSnake(str: string): string {
  return str.replaceAll(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function buildMapping<T extends TableFields>(
  fields: T,
  options?: DefineContractOptions
): StringMapping<T> {
  const mapping = {} as Record<string, { name: string }>;
  const overrides = options?.mapping ?? {};
  const useSnake = options?.defaultMapping === "camelToSnake";

  for (const key of Object.keys(fields) as (keyof T)[]) {
    const colName =
      overrides[key as string]?.name ?? (useSnake ? camelToSnake(key as string) : (key as string));
    mapping[key as string] = { name: colName };
  }
  return mapping as StringMapping<T>;
}

export interface TableContract<T extends TableFields> {
  readonly tableName: string;
  readonly fields: T;
  readonly mapping: StringMapping<T>;
}

/**
 * Defines a table contract.
 * Overload: defineContract(contract) returns contract as-is (legacy).
 * Overload: defineContract(tableName, fields, options?) returns TableContract.
 */
export function defineContract<T extends AnyContract>(contract: T): T;
export function defineContract<T extends TableFields>(
  tableName: string,
  fields: T,
  options?: DefineContractOptions
): TableContract<T>;
export function defineContract<T extends TableFields>(
  tableNameOrContract: string | T,
  fields?: T,
  options?: DefineContractOptions
): T | TableContract<T> {
  if (typeof tableNameOrContract === "string" && fields) {
    return defineTableContract(tableNameOrContract, fields, options) as TableContract<T>;
  }
  return tableNameOrContract as T;
}

function defineTableContract<T extends TableFields>(
  tableName: string,
  fields: T,
  options?: DefineContractOptions
): TableContract<T> {
  const mapping = buildMapping(fields, options);

  return {
    tableName,
    fields,
    mapping,
  };
}

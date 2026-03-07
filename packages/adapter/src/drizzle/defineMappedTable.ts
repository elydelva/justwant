/**
 * Define a mapped table: Drizzle table + contract + mapping.
 * Returns a DrizzleMappedTable that needs client injection via createDrizzleAdapter.
 */

import type { AnyContract, InferContract } from "@justwant/adapter";
import { getTableName } from "drizzle-orm";
import type { Table } from "drizzle-orm";
import type { MappingFor } from "./mapping.js";
import type {
  DefineMappedTableOptions,
  DrizzleMappedTable,
  DrizzleMappedTableInternal,
} from "./types.js";

const defaultOptions: Required<Omit<DefineMappedTableOptions, "softDeleteColumn">> & {
  softDeleteColumn: string | null;
} = {
  softDeleteColumn: "deletedAt",
};

/**
 * Defines a mapped table from a Drizzle table and a contract.
 * The returned table must be used with createDrizzleAdapter to inject the client.
 *
 * @param table - Drizzle table
 * @param contract - Adapter contract (from defineContract)
 * @param mapping - Map contract keys to table columns
 * @param options - softDeleteColumn (default 'deletedAt'), or null to disable
 */
export function defineMappedTable<TTable extends Table, TContract extends AnyContract>(
  table: TTable,
  contract: TContract,
  mapping: MappingFor<TTable, TContract>,
  options?: DefineMappedTableOptions
): DrizzleMappedTable<TTable, TContract> {
  const opts = { ...defaultOptions, ...options };
  const tableName = getTableName(table);

  const internal: DrizzleMappedTableInternal<TTable, TContract> = {
    contract,
    source: table,
    mapping,
    client: null as unknown as DrizzleMappedTableInternal<TTable, TContract>["client"],
    tableName,
    sql: {
      findById: () => {
        throw new Error(
          "defineMappedTable: use createDrizzleAdapter to create a fully configured adapter"
        );
      },
      findOne: () => {
        throw new Error(
          "defineMappedTable: use createDrizzleAdapter to create a fully configured adapter"
        );
      },
      findMany: () => {
        throw new Error(
          "defineMappedTable: use createDrizzleAdapter to create a fully configured adapter"
        );
      },
      create: () => {
        throw new Error(
          "defineMappedTable: use createDrizzleAdapter to create a fully configured adapter"
        );
      },
      update: () => {
        throw new Error(
          "defineMappedTable: use createDrizzleAdapter to create a fully configured adapter"
        );
      },
      delete: () => {
        throw new Error(
          "defineMappedTable: use createDrizzleAdapter to create a fully configured adapter"
        );
      },
      hardDelete: () => {
        throw new Error(
          "defineMappedTable: use createDrizzleAdapter to create a fully configured adapter"
        );
      },
    },
  };

  return {
    get infer() {
      return undefined as unknown as InferContract<TContract>;
    },
    contract,
    _internal: internal,
  };
}

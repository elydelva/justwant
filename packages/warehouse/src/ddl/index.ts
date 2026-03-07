/**
 * DDL generation for warehouse dialects.
 */

import type { FieldDef, TableContract } from "@justwant/contract";
import type { WarehouseDialect } from "../types.js";
import { getCreateTableSQL as getClickHouseDDL } from "./clickhouse.js";
import { getCreateTableSQL as getDuckDbDDL } from "./duckdb.js";

export { getCreateTableSQL as getCreateTableSQLClickHouse } from "./clickhouse.js";
export { getCreateTableSQL as getCreateTableSQLDuckDb } from "./duckdb.js";
export { getExistTableSQL } from "./exist.js";
export { getDropTableSQL } from "./drop.js";

export function getCreateTableSQL(
  contract: TableContract<Record<string, FieldDef<unknown, boolean>>>,
  dialect: WarehouseDialect,
  options?: { ifNotExists?: boolean }
): string {
  switch (dialect) {
    case "clickhouse":
      return getClickHouseDDL(contract, options);
    case "duckdb":
      return getDuckDbDDL(contract, options);
    default:
      throw new Error(`Unsupported warehouse dialect: ${dialect}`);
  }
}

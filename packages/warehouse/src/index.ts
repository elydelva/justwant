/**
 * @justwant/warehouse - DAL for data warehouses (OLAP).
 */

export { createWarehouse, createWarehouseFromSql } from "./core.js";
export type {
  Warehouse,
  WarehouseConnectionConfig,
  WarehouseDialect,
  WarehouseMappedTable,
  QueryOptions,
  AggregateOptions,
  WaddlerSql,
  WaddlerQuery,
  StringMapping,
} from "./types.js";
export {
  parseWarehouseError,
  WarehouseError,
  WarehouseConnectionError,
  WarehouseTimeoutError,
} from "./errors.js";
export {
  getCreateTableSQL,
  getCreateTableSQLClickHouse,
  getCreateTableSQLDuckDb,
} from "./ddl/index.js";
export { appendWhere } from "./buildWhere.js";
export { appendOrderBy, type OrderDirection } from "./buildOrderBy.js";
export { mapRowToContract, mapContractToRow } from "./mapping.js";

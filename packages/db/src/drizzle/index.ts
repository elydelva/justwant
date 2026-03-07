export { createDrizzleAdapter } from "./createAdapter.js";
export { defineMappedTable } from "./defineMappedTable.js";
export { buildWhere } from "./buildWhere.js";
export { buildOrderBy, type OrderDirection } from "./buildOrderBy.js";
export { buildPagination, type PaginationOptions } from "./buildPagination.js";
export { upsert } from "./upsert.js";
export { bulkInsert } from "./bulkInsert.js";
export { collectSchemas } from "./collectSchemas.js";
export { parseDbError } from "./errors.js";
export { mapRowToContract } from "./mapping.js";

export type {
  DrizzleClient,
  DrizzleAdapter,
  DrizzleMappedTable,
  DrizzleMappedTableInternal,
  DefineMappedTableOptions,
} from "./types.js";
export type { MappingFor, TableMapping } from "./mapping.js";

export {
  AdapterError,
  AdapterNotFoundError,
  AdapterConstraintError,
  AdapterForeignKeyViolationError,
  AdapterUniqueViolationError,
  AdapterNotNullViolationError,
  AdapterCheckViolationError,
  AdapterMappingError,
  AdapterUnsupportedError,
  AdapterConnectionError,
  AdapterTransactionError,
  AdapterTimeoutError,
  isAdapterError,
} from "@justwant/db/errors";

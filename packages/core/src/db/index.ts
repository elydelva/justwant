/**
 * @justwant/core/db — Shared SQL utilities for @justwant/db and @justwant/warehouse.
 */

export type { WaddlerSql, WaddlerQuery, StringMapping, ContractStringMapping } from "./types.js";
export type { ColumnLike } from "./mapping.js";
export { mapRowToContract, mapContractToRow } from "./mapping.js";
export type { AppendWhereOptions } from "./where.js";
export { appendWhere } from "./where.js";
export type { OrderDirection } from "./orderBy.js";
export { appendOrderBy } from "./orderBy.js";
export { escapeIdentifier, escapeStringLiteral } from "./escape.js";
export { toRows, parseExistResult } from "./rows.js";

/**
 * Warehouse adapter core - batch insert, query, aggregate.
 */

import type { InferContract, TableContract, TableFields } from "@justwant/contract";
import { appendOrderBy } from "./buildOrderBy.js";
import { appendWhere } from "./buildWhere.js";
import { getCreateTableSQL, getDropTableSQL, getExistTableSQL } from "./ddl/index.js";
import { parseWarehouseError } from "./errors.js";
import { mapContractToRow, mapRowToContract } from "./mapping.js";
import type {
  AggregateOptions,
  QueryOptions,
  WaddlerQuery,
  WaddlerSql,
  Warehouse,
  WarehouseConnectionConfig,
  WarehouseDialect,
  WarehouseMappedTable,
} from "./types.js";

/** Normalize query result to row array. */
function toRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  const r = result as { rows?: unknown[] };
  return (r?.rows ?? []) as Record<string, unknown>[];
}

/** Normalize BigInt to number in aggregate results (DuckDB, ClickHouse return BigInt for count/sum). */
function normalizeAggregateRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === "bigint" ? Number(v) : v;
  }
  return out;
}

/** Parse exist() query result to boolean. */
function parseExistResult(rows: Record<string, unknown>[]): boolean {
  const row = rows[0];
  if (!row) return false;
  const val = Object.values(row)[0];
  return val === 1 || val === true || (typeof val === "number" && val !== 0);
}

export interface CreateWarehouseFromSqlOptions {
  dialect: WarehouseDialect;
  driver?: unknown;
}

/**
 * Creates a warehouse from connection config. Use with driver factories (createDuckDbAdapter, etc.).
 */
export function createWarehouse(config: WarehouseConnectionConfig): Warehouse {
  const wh = createWarehouseFromSql(config.sql, config);
  if (config.close) {
    return { ...wh, close: config.close };
  }
  return wh;
}

/**
 * Creates a warehouse from a Waddler SQL client.
 * Low-level: use createWarehouse with a driver factory for the common case.
 */
export function createWarehouseFromSql(
  sql: WaddlerSql,
  options: CreateWarehouseFromSqlOptions
): Warehouse {
  const { dialect, driver } = options;

  const adapter: Warehouse = {
    sql,
    dialect,
    driver,

    async createTable(contract) {
      try {
        const ddl = getCreateTableSQL(contract, dialect);
        await sql`${sql.raw(ddl)}`;
      } catch (err) {
        throw parseWarehouseError(err);
      }
    },

    table(contract) {
      const mapping = contract.mapping as Record<string, { name: string }>;
      const tableName = contract.tableName;
      const tableId = sql.identifier(tableName);

      const fromDbRow = (row: Record<string, unknown>) =>
        mapRowToContract<InferContract<typeof contract>>(row, mapping, contract.fields);

      const mapped: WarehouseMappedTable<typeof contract.fields> = {
        contract,
        async createTable() {
          try {
            const ddl = getCreateTableSQL(contract, dialect, { ifNotExists: true });
            await sql`${sql.raw(ddl)}`;
          } catch (err) {
            throw parseWarehouseError(err);
          }
        },
        async exist() {
          try {
            const existSql = getExistTableSQL(tableName, dialect);
            const rows = toRows(await sql`${sql.raw(existSql)}`);
            return parseExistResult(rows);
          } catch (err) {
            throw parseWarehouseError(err);
          }
        },
        async drop() {
          try {
            const dropSql = getDropTableSQL(tableName, dialect);
            await sql`${sql.raw(dropSql)}`;
          } catch (err) {
            throw parseWarehouseError(err);
          }
        },
        async insert(rows) {
          if (rows.length === 0) return;
          try {
            const colOrder = Object.entries(mapping).map(([, col]) => col.name);
            const sqlDefault = (sql as { default?: unknown }).default;
            const tuples = rows.map((row) => {
              const dbRow = mapContractToRow(row as Record<string, unknown>, mapping);
              return colOrder.map((col) => {
                const val = dbRow[col];
                return val === undefined && sqlDefault !== undefined ? sqlDefault : val;
              });
            });
            const colList = colOrder.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(", ");
            await sql`INSERT INTO ${tableId} (${sql.raw(colList)}) VALUES ${sql.values(tuples)}`;
          } catch (err) {
            throw parseWarehouseError(err);
          }
        },

        async query(options?: QueryOptions<typeof contract>) {
          try {
            const query: WaddlerQuery = sql`SELECT * FROM ${tableId}`;
            const append = query.append;

            if (append && options) {
              const where = (options.where ?? {}) as Record<string, unknown>;
              const hasWhere = Object.entries(where).some(([, v]) => v !== undefined);
              if (hasWhere) {
                appendWhere(sql, query, mapping, where);
              }
              if (options.orderBy && Object.keys(options.orderBy).length > 0) {
                appendOrderBy(sql, query, mapping, options.orderBy);
              }
              if (options.limit !== undefined) {
                append.call(query, sql` LIMIT ${options.limit}`);
              }
              if (options.offset !== undefined) {
                append.call(query, sql` OFFSET ${options.offset}`);
              }
            }

            const rows = toRows(await query);
            return rows.map((r) => fromDbRow(r));
          } catch (err) {
            throw parseWarehouseError(err);
          }
        },

        async aggregate<A>(options: AggregateOptions<typeof contract.fields, A>) {
          try {
            const groupBy = options.groupBy ?? [];
            const selectEntries = Object.entries(options.select);
            const selectExprs = selectEntries.map(([alias, expr]) => `${expr} AS ${alias}`);
            const groupByCols = groupBy.map((k) => mapping[k as string]?.name).filter(Boolean);
            const selectClause =
              groupByCols.length > 0
                ? [...groupByCols.map((c) => `"${c}"`), ...selectExprs].join(", ")
                : selectExprs.join(", ");
            const groupByClause =
              groupByCols.length > 0
                ? ` GROUP BY ${groupByCols.map((c) => `"${c}"`).join(", ")}`
                : "";

            const query: WaddlerQuery = sql`SELECT ${sql.raw(selectClause)} FROM ${tableId}`;
            const append = query.append;

            const where = (options.where ?? {}) as Record<string, unknown>;
            const hasWhere = Object.entries(where).some(([, v]) => v !== undefined);
            if (append && hasWhere) {
              appendWhere(sql, query, mapping, where);
            }
            if (append && groupByClause) {
              append.call(query, sql`${sql.raw(groupByClause)}`);
            }

            const rows = toRows(await query);
            return rows.map((r) => normalizeAggregateRow(r)) as A[];
          } catch (err) {
            throw parseWarehouseError(err);
          }
        },
      };

      return mapped;
    },
  };

  return adapter;
}

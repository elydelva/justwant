/**
 * Warehouse adapter core - batch insert, query, aggregate.
 */

import type { InferContract, TableContract, TableFields } from "@justwant/contract";
import { parseExistResult, toRows } from "@justwant/core/db";
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

/** Normalize BigInt/string to number in aggregate results (DuckDB, ClickHouse return BigInt or string for count/sum). */
function normalizeAggregateRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "bigint") out[k] = Number(v);
    else if (typeof v === "string" && /^\d+$/.test(v)) out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}

/** Execute DDL/mutation (CREATE, DROP, INSERT). ClickHouse requires .command() to avoid JSON parse on empty response. */
async function executeMutation(q: WaddlerQuery, dialect: WarehouseDialect): Promise<void> {
  const cmd = (q as { command?: () => Promise<unknown> }).command;
  if (dialect === "clickhouse" && typeof cmd === "function") {
    await cmd.call(q);
  } else {
    await q;
  }
}

function resolveClickhouseTypes(
  colOrder: string[],
  mapping: Record<string, { name: string }>,
  fields: Record<string, unknown>
): string[] {
  const nameToKey: Record<string, string> = {};
  for (const [key, col] of Object.entries(mapping)) {
    nameToKey[col.name] = key;
  }
  return colOrder.map((col) => {
    const key = nameToKey[col];
    const field = key ? fields[key] : undefined;
    if (!field) return "String";
    let base: string;
    if ((field as { _columnType?: string })._columnType === "REAL") base = "Float64";
    else if ((field as { _columnType?: string })._columnType === "INTEGER") base = "Int64";
    else base = "String";
    return !(field as { _required?: boolean })._required ? `Nullable(${base})` : base;
  });
}

function buildInsertTuples(
  rows: Record<string, unknown>[],
  colOrder: string[],
  mapping: Record<string, { name: string }>,
  dialect: WarehouseDialect,
  sqlDefault: unknown
): unknown[][] {
  return rows.map((row) => {
    const dbRow = mapContractToRow(row, mapping);
    return colOrder.map((col) => {
      const val = dbRow[col];
      if (val === undefined) {
        return dialect === "clickhouse" ? null : (sqlDefault ?? null);
      }
      return val;
    });
  });
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
        await executeMutation(sql`${sql.raw(ddl)}`, dialect);
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
            await executeMutation(sql`${sql.raw(ddl)}`, dialect);
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
            await executeMutation(sql`${sql.raw(dropSql)}`, dialect);
          } catch (err) {
            throw parseWarehouseError(err);
          }
        },
        async insert(rows) {
          if (rows.length === 0) return;
          try {
            const colOrder = Object.entries(mapping).map(([, col]) => col.name);
            const sqlDefault = (sql as { default?: unknown }).default;
            const tuples = buildInsertTuples(
              rows as Record<string, unknown>[],
              colOrder,
              mapping,
              dialect,
              sqlDefault
            );
            const colList = colOrder.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(", ");
            const types =
              dialect === "clickhouse"
                ? resolveClickhouseTypes(
                    colOrder,
                    mapping,
                    contract.fields as Record<string, unknown>
                  )
                : undefined;
            const valuesArg =
              types !== undefined
                ? (sql as { values: (v: unknown[][], t?: string[]) => unknown }).values(
                    tuples,
                    types
                  )
                : sql.values(tuples);
            await executeMutation(
              sql`INSERT INTO ${tableId} (${sql.raw(colList)}) VALUES ${valuesArg}`,
              dialect
            );
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
            const quotedGroupCols = groupByCols.map((c) => `"${c}"`);
            const selectClause =
              groupByCols.length > 0
                ? [...quotedGroupCols, ...selectExprs].join(", ")
                : selectExprs.join(", ");
            const groupByClause =
              groupByCols.length > 0 ? ` GROUP BY ${quotedGroupCols.join(", ")}` : "";

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

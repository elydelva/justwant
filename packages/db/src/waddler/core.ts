/**
 * Waddler adapter core - CRUD with schema-less mapping.
 */

import type { AnyContract, InferContract } from "@justwant/contract";
import type { TableContract } from "@justwant/contract";
import { ContractValidationError, validateContractData } from "@justwant/contract/validate";
import type { BoundQuery, CreateInput } from "@justwant/db";
import { getCreateTableSQL, getDropTableSQL, getExistTableSQL } from "../ddl/index.js";
import { appendWhere } from "./buildWhere.js";
import { parseWaddlerError } from "./errors.js";
import { mapRowToContract } from "./mapping.js";
import type {
  CreateWaddlerAdapterOptions,
  Db,
  DefineWaddlerTableOptions,
  StringMapping,
  TableOptions,
  TableSource,
  WaddlerConnectionConfig,
  WaddlerDialect,
  WaddlerMappedTable,
  WaddlerQuery,
  WaddlerSql,
} from "./types.js";

function resolveTableIdentifier(
  sql: WaddlerSql,
  source: TableSource
): ReturnType<WaddlerSql["identifier"]> {
  if (typeof source === "string") {
    return sql.identifier(source) as ReturnType<WaddlerSql["identifier"]>;
  }
  return sql.identifier(source) as ReturnType<WaddlerSql["identifier"]>;
}

function resolveTableName(source: TableSource): string {
  if (typeof source === "string") return source;
  return source.schema ? `${source.schema}.${source.table}` : source.table;
}

function resolveTableSchema(source: TableSource): string | undefined {
  if (typeof source === "string") return undefined;
  return source.schema;
}

function resolveSimpleTableName(source: TableSource): string {
  if (typeof source === "string") return source;
  return source.table;
}

/** Parse exist() query result to boolean. */
function parseExistResult(rows: Record<string, unknown>[]): boolean {
  const row = rows[0];
  if (!row) return false;
  const val = Object.values(row)[0];
  return val === 1 || val === true || (typeof val === "number" && val !== 0);
}

/** Normalize query result to row array. */
function toRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  const r = result as { rows?: unknown[] };
  return (r?.rows ?? []) as Record<string, unknown>[];
}

/**
 * Build SELECT query with optional WHERE. Uses append if available.
 */
function buildSelectQuery(
  sql: WaddlerSql,
  tableId: unknown,
  mapping: Record<string, { name: string }>,
  where: Record<string, unknown>,
  softDeleteColName: string | null,
  limit?: number
): WaddlerQuery {
  const hasWhere = softDeleteColName || Object.entries(where).some(([, v]) => v !== undefined);

  const query = sql`SELECT * FROM ${tableId}`;
  const append = query.append;

  if (append && hasWhere) {
    if (softDeleteColName) {
      append.call(query, sql` WHERE `);
      append.call(query, sql`${sql.identifier(softDeleteColName)} IS NULL`);
      const whereFiltered = Object.fromEntries(
        Object.entries(where).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(whereFiltered).length > 0) {
        appendWhere(sql, query, mapping, whereFiltered, {
          firstConnector: " AND ",
        });
      }
    } else {
      appendWhere(sql, query, mapping, where);
    }
  } else if (
    append &&
    !hasWhere &&
    Object.keys(where).some((k) => (where as Record<string, unknown>)[k] !== undefined)
  ) {
    appendWhere(sql, query, mapping, where);
  }

  if (append && limit !== undefined) {
    append.call(query, sql` LIMIT ${limit}`);
  }

  return query;
}

/**
 * Creates a db from connection config. Use with driver factories (createBunSqliteAdapter, etc.).
 */
export function createDb(config: WaddlerConnectionConfig): Db {
  const db = createWaddlerAdapter(config.sql, config);
  if (config.close) {
    return { ...db, close: config.close };
  }
  return db;
}

/**
 * Creates a Waddler adapter for the given SQL client.
 * Low-level: use createDb with a driver factory for the common case.
 */
export function createWaddlerAdapter(sql: WaddlerSql, options: CreateWaddlerAdapterOptions): Db {
  const { dialect, driver } = options;
  const supportsReturning = dialect === "pg" || dialect === "sqlite";

  const adapter: Db = {
    sql,
    driver,
    dialect,

    async createTable(contract) {
      const dialect = adapter.dialect as "sqlite" | "pg" | "mysql";
      const ddl = getCreateTableSQL(contract, dialect);
      await sql`${sql.raw(ddl)}`;
    },

    table(contract, tableOptions) {
      const mergedMapping = {
        ...(contract.mapping as Record<string, { name: string }>),
        ...tableOptions?.mapping,
      } as StringMapping<typeof contract.fields>;
      return adapter.defineTable(contract.tableName, contract.fields, mergedMapping, {
        softDeleteColumn: tableOptions?.softDeleteColumn,
      });
    },

    defineTable(tableSource, contract, mapping, defineOptions) {
      const softDeleteCol = defineOptions?.softDeleteColumn ?? "deletedAt";
      const tableId = resolveTableIdentifier(sql, tableSource);
      const tableName = resolveTableName(tableSource);
      const simpleTableName = resolveSimpleTableName(tableSource);
      const schema = resolveTableSchema(tableSource);
      const mappingRecord = mapping as Record<string, { name: string }>;
      const idCol = mappingRecord.id ?? { name: "id" };
      const idColName = idCol.name;
      const softDeleteColName =
        softDeleteCol &&
        (mappingRecord[softDeleteCol] ||
          Object.values(mappingRecord).some((c) => c.name === softDeleteCol))
          ? (mappingRecord[softDeleteCol]?.name ?? softDeleteCol)
          : null;

      const createBoundQuery = <T>(fn: () => Promise<T>): BoundQuery<T> => ({
        get _result() {
          return undefined as T;
        },
        async execute() {
          try {
            return await fn();
          } catch (err) {
            if (err instanceof ContractValidationError) throw err;
            throw parseWaddlerError(err);
          }
        },
      });

      const toDbValues = (data: Record<string, unknown>) => {
        const values: Record<string, unknown> = {};
        for (const [contractKey, col] of Object.entries(mappingRecord)) {
          if (contractKey in data) {
            values[col.name] = data[contractKey];
          }
        }
        return values;
      };

      const fromDbRow = (row: Record<string, unknown>) =>
        mapRowToContract<InferContract<typeof contract>>(row, mappingRecord, contract);

      const sqlOps = {
        findById: (id: string) =>
          createBoundQuery(async () => {
            let query: WaddlerQuery;
            if (softDeleteColName) {
              query = sql`SELECT * FROM ${tableId} WHERE ${sql.identifier(idColName)} = ${id} AND ${sql.identifier(softDeleteColName)} IS NULL`;
            } else {
              query = sql`SELECT * FROM ${tableId} WHERE ${sql.identifier(idColName)} = ${id}`;
            }
            const rows = toRows(await query);
            const row = rows[0];
            return row ? fromDbRow(row) : null;
          }),

        findOne: (where: Partial<InferContract<typeof contract>>) =>
          createBoundQuery(async () => {
            const query = buildSelectQuery(
              sql,
              tableId,
              mappingRecord,
              where as Record<string, unknown>,
              softDeleteColName,
              1
            );
            const rows = toRows(await query);
            const row = rows[0];
            return row ? fromDbRow(row) : null;
          }),

        findMany: (where: Partial<InferContract<typeof contract>>) =>
          createBoundQuery(async () => {
            const query = buildSelectQuery(
              sql,
              tableId,
              mappingRecord,
              where as Record<string, unknown>,
              softDeleteColName
            );
            const rows = toRows(await query);
            return rows.map((r) => fromDbRow(r));
          }),

        create: (data: CreateInput<typeof contract>) =>
          createBoundQuery(async () => {
            const validated = validateContractData(data as Record<string, unknown>, contract);
            if (!validated.ok) {
              throw new ContractValidationError(validated.issues);
            }
            const values = toDbValues(validated.value);
            const idMapping = mappingRecord.id;
            if (idMapping && !(idMapping.name in values)) {
              values[idMapping.name] = crypto.randomUUID();
            }
            const cols = Object.keys(values);
            const vals = Object.values(values);
            const colList = cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(", ");
            const returning = supportsReturning ? " RETURNING *" : "";

            const insertQuery = sql`INSERT INTO ${tableId} (${sql.raw(colList)}) VALUES ${sql.values([vals])}${sql.raw(returning)}`;
            const rows = toRows(await insertQuery);

            if (supportsReturning && rows[0]) {
              return fromDbRow(rows[0]);
            }
            if (!supportsReturning && dialect === "mysql") {
              const selectQuery = sql`SELECT * FROM ${tableId} ORDER BY ${sql.identifier(idColName)} DESC LIMIT 1`;
              const lastRows = toRows(await selectQuery);
              const row = lastRows[0];
              if (!row) throw new Error("Insert did not return row");
              return fromDbRow(row);
            }
            const row = rows[0];
            if (!row) throw new Error("Insert did not return row");
            return fromDbRow(row);
          }),

        update: (id: string, data: Partial<InferContract<typeof contract>>) =>
          createBoundQuery(async () => {
            const dataRecord = data as Record<string, unknown>;
            const validated = validateContractData(dataRecord, contract, {
              keys: Object.keys(dataRecord),
            });
            if (!validated.ok) {
              throw new ContractValidationError(validated.issues);
            }
            const values = toDbValues(validated.value);
            const entries = Object.entries(values);
            if (entries.length === 0) {
              const selectQuery = sql`SELECT * FROM ${tableId} WHERE ${sql.identifier(idColName)} = ${id}`;
              const rows = toRows(await selectQuery);
              const row = rows[0];
              if (!row) throw new Error("Update did not return row");
              return fromDbRow(row);
            }

            const setClause = entries
              .map(([col, val]) => sql`${sql.identifier(col)} = ${val}`)
              .reduce(
                (acc, part, i) => (i === 0 ? part : (sql`${acc}, ${part}` as typeof acc)),
                sql.raw("") as unknown
              );

            const updateQuery = sql`UPDATE ${tableId} SET ${setClause} WHERE ${sql.identifier(idColName)} = ${id}${supportsReturning ? sql.raw(" RETURNING *") : sql.raw("")}`;
            const rows = toRows(await updateQuery);

            if (supportsReturning && rows[0]) return fromDbRow(rows[0]);
            const selectQuery = sql`SELECT * FROM ${tableId} WHERE ${sql.identifier(idColName)} = ${id}`;
            const selRows = toRows(await selectQuery);
            const selRow = selRows[0];
            if (!selRow) throw new Error("Update did not return row");
            return fromDbRow(selRow);
          }),

        delete: (id: string) =>
          createBoundQuery(async () => {
            if (softDeleteColName) {
              const now = new Date().toISOString();
              await sql`UPDATE ${tableId} SET ${sql.identifier(softDeleteColName)} = ${now} WHERE ${sql.identifier(idColName)} = ${id}`;
            } else {
              await sql`DELETE FROM ${tableId} WHERE ${sql.identifier(idColName)} = ${id}`;
            }
          }),

        hardDelete: (id: string) =>
          createBoundQuery(async () => {
            await sql`DELETE FROM ${tableId} WHERE ${sql.identifier(idColName)} = ${id}`;
          }),
      };

      const tableContract = {
        tableName: simpleTableName,
        fields: contract,
        mapping,
      } as TableContract<typeof contract>;

      const mapped: WaddlerMappedTable<typeof contract> = {
        get infer() {
          return undefined as unknown as InferContract<typeof contract>;
        },
        contract,
        _internal: {
          contract,
          sql: sqlOps,
          tableName,
          mapping: mapping as StringMapping<typeof contract>,
          client: sql,
        },
        create: (data) => sqlOps.create(data).execute(),
        findById: (id) => sqlOps.findById(id).execute(),
        findOne: (where) => sqlOps.findOne(where).execute(),
        findMany: (where) => sqlOps.findMany(where).execute(),
        update: (id, data) => sqlOps.update(id, data).execute(),
        delete: (id) => sqlOps.delete(id).execute(),
        hardDelete: (id) => sqlOps.hardDelete(id).execute(),
        createSafe: async (data) => {
          const validated = validateContractData(data as Record<string, unknown>, contract);
          if (!validated.ok) return validated;
          const created = await sqlOps
            .create(validated.value as CreateInput<typeof contract>)
            .execute();
          return { ok: true, value: created };
        },
        updateSafe: async (id, data) => {
          const dataRecord = data as Record<string, unknown>;
          const validated = validateContractData(dataRecord, contract, {
            keys: Object.keys(dataRecord),
          });
          if (!validated.ok) return validated;
          const updated = await sqlOps
            .update(id, validated.value as Partial<InferContract<typeof contract>>)
            .execute();
          return { ok: true, value: updated };
        },
        createTable: async () => {
          try {
            const ddl = getCreateTableSQL(tableContract, dialect as "sqlite" | "pg" | "mysql", {
              schema,
              ifNotExists: true,
            });
            await sql`${sql.raw(ddl)}`;
          } catch (err) {
            if (err instanceof ContractValidationError) throw err;
            throw parseWaddlerError(err);
          }
        },
        exist: async () => {
          try {
            const existSql = getExistTableSQL(
              simpleTableName,
              dialect as "sqlite" | "pg" | "mysql",
              schema
            );
            const rows = toRows(await sql`${sql.raw(existSql)}`);
            return parseExistResult(rows);
          } catch (err) {
            if (err instanceof ContractValidationError) throw err;
            throw parseWaddlerError(err);
          }
        },
        drop: async () => {
          try {
            const dropSql = getDropTableSQL(
              simpleTableName,
              dialect as "sqlite" | "pg" | "mysql",
              schema
            );
            await sql`${sql.raw(dropSql)}`;
          } catch (err) {
            if (err instanceof ContractValidationError) throw err;
            throw parseWaddlerError(err);
          }
        },
      };

      return mapped;
    },
  };

  return adapter;
}

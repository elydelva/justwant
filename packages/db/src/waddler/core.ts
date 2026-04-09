/**
 * Waddler adapter core - CRUD with schema-less mapping.
 */

import type { InferContract } from "@justwant/contract";
import { ContractValidationError, validateContractData } from "@justwant/contract/validate";
import { parseExistResult, toRows } from "@justwant/core/db";
import type { BoundQuery, CreateInput } from "@justwant/db";
import { getCreateTableSQL, getDropTableSQL, getExistTableSQL } from "../ddl/index.js";
import { parseWaddlerError } from "./errors.js";
import { mapRowToContract } from "./mapping.js";
import type {
  CreateWaddlerAdapterOptions,
  Db,
  StringMapping,
  TableSource,
  WaddlerConnectionConfig,
  WaddlerMappedTable,
  WaddlerQuery,
  WaddlerSql,
} from "./types.js";

function resolveTableIdentifier(
  sql: WaddlerSql,
  source: TableSource
): ReturnType<WaddlerSql["identifier"]> {
  if (typeof source === "string") {
    return sql.identifier(source);
  }
  return sql.identifier(source);
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

/**
 * Build SELECT query with optional WHERE.
 * Uses a single template (no append) to avoid waddler node-postgres bug:
 * NodePgSQLTemplate caches query text at construction; append updates params
 * but not the cached text, causing "bind message supplies N parameters,
 * but prepared statement requires 0".
 */
function buildSelectQuery(
  sql: WaddlerSql,
  tableId: unknown,
  mapping: Record<string, { name: string }>,
  where: Record<string, unknown>,
  softDeleteColName: string | null,
  limit?: number
): WaddlerQuery {
  const whereEntries = Object.entries(where).filter(([, v]) => v !== undefined);
  const hasWhere = !!softDeleteColName || whereEntries.length > 0;

  if (!hasWhere) {
    if (limit !== undefined) {
      return sql`SELECT * FROM ${tableId} LIMIT ${limit}`;
    }
    return sql`SELECT * FROM ${tableId}`;
  }

  // Build WHERE as single template (no append) for pg/mysql compatibility
  const conditions: WaddlerQuery[] = [];
  if (softDeleteColName) {
    conditions.push(sql`${sql.identifier(softDeleteColName)} IS NULL`);
  }
  for (const [key, val] of whereEntries) {
    const colName = mapping[key]?.name;
    if (colName) {
      conditions.push(sql`${sql.identifier(colName)} = ${val}`);
    }
  }

  if (conditions.length === 0) {
    if (limit !== undefined) {
      return sql`SELECT * FROM ${tableId} LIMIT ${limit}`;
    }
    return sql`SELECT * FROM ${tableId}`;
  }

  let query: WaddlerQuery = sql`SELECT * FROM ${tableId} WHERE ${conditions[0]}`;
  for (let i = 1; i < conditions.length; i++) {
    query = sql`${query} AND ${conditions[i]}`;
  }
  if (limit !== undefined) {
    query = sql`${query} LIMIT ${limit}`;
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
      const dialect = adapter.dialect;
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

      async function doCreate(
        data: CreateInput<typeof contract>
      ): Promise<InferContract<typeof contract>> {
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
        const colList =
          dialect === "mysql"
            ? cols.map((c) => `\`${String(c).replaceAll("`", "``")}\``).join(", ")
            : cols.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(", ");
        const returning = supportsReturning ? " RETURNING *" : "";

        const insertQuery = sql`INSERT INTO ${tableId} (${sql.raw(colList)}) VALUES ${sql.values([vals])}${sql.raw(returning)}`;
        const rows = toRows(await insertQuery);

        if (supportsReturning && rows[0]) {
          return fromDbRow(rows[0]);
        }
        if (!supportsReturning && dialect === "mysql") {
          const insertedId = values[idColName];
          if (insertedId == null) throw new Error("MySQL create requires id in data");
          const selectQuery = sql`SELECT * FROM ${tableId} WHERE ${sql.identifier(idColName)} = ${insertedId}`;
          const lastRows = toRows(await selectQuery);
          const row = lastRows[0];
          if (!row) throw new Error("Insert did not return row");
          return fromDbRow(row);
        }
        const row = rows[0];
        if (!row) throw new Error("Insert did not return row");
        return fromDbRow(row);
      }

      async function doUpdate(
        id: string,
        data: Partial<InferContract<typeof contract>>
      ): Promise<InferContract<typeof contract>> {
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
          .reduce((acc, part, i) => (i === 0 ? part : sql`${acc}, ${part}`), sql.raw(""));

        const updateQuery = sql`UPDATE ${tableId} SET ${setClause} WHERE ${sql.identifier(idColName)} = ${id}${supportsReturning ? sql.raw(" RETURNING *") : sql.raw("")}`;
        const rows = toRows(await updateQuery);

        if (supportsReturning && rows[0]) return fromDbRow(rows[0]);
        const selectQuery = sql`SELECT * FROM ${tableId} WHERE ${sql.identifier(idColName)} = ${id}`;
        const selRows = toRows(await selectQuery);
        const selRow = selRows[0];
        if (!selRow) throw new Error("Update did not return row");
        return fromDbRow(selRow);
      }

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
            return rows.map(fromDbRow);
          }),

        create: (data: CreateInput<typeof contract>) => createBoundQuery(() => doCreate(data)),

        update: (id: string, data: Partial<InferContract<typeof contract>>) =>
          createBoundQuery(() => doUpdate(id, data)),

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
      };

      const mapped: WaddlerMappedTable<typeof contract> = {
        get infer() {
          return undefined as unknown as InferContract<typeof contract>;
        },
        contract,
        _internal: {
          contract,
          sql: sqlOps,
          tableName,
          mapping,
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
            const ddl = getCreateTableSQL(tableContract, dialect, {
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
            const existSql = getExistTableSQL(simpleTableName, dialect, schema);
            const rows = toRows(await sql`${sql.raw(existSql)}`);
            return parseExistResult(rows);
          } catch (err) {
            if (err instanceof ContractValidationError) throw err;
            throw parseWaddlerError(err);
          }
        },
        drop: async () => {
          try {
            const dropSql = getDropTableSQL(simpleTableName, dialect, schema);
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

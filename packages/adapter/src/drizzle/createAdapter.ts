/**
 * Create a Drizzle adapter with full CRUD implementation.
 */

import type { AnyContract, CreateInput, InferContract } from "@justwant/adapter";
import type { BoundQuery } from "@justwant/adapter";
import { and, eq, isNull } from "drizzle-orm";
import type { Table } from "drizzle-orm";
import { getTableName } from "drizzle-orm";
import { buildWhere } from "./buildWhere.js";
import { defineMappedTable } from "./defineMappedTable.js";
import { parseDbError } from "./errors.js";
import { mapRowToContract } from "./mapping.js";
import type { MappingFor } from "./mapping.js";
import type {
  DefineMappedTableOptions,
  DrizzleAdapter,
  DrizzleClient,
  DrizzleMappedTable,
} from "./types.js";

export interface CreateDrizzleAdapterOptions {
  debug?: boolean;
  onQuery?: (sql: string, params: unknown[]) => void;
  /** Override dialect when auto-detection fails (e.g. bun-sqlite). */
  dialect?: "pg" | "mysql" | "sqlite";
}

/**
 * Creates a Drizzle adapter for the given database client.
 */
export function createDrizzleAdapter(
  db: DrizzleClient,
  options?: CreateDrizzleAdapterOptions
): DrizzleAdapter {
  const dialect = options?.dialect ?? inferDialect(db);
  const onQuery = options?.onQuery;

  const adapter: DrizzleAdapter = {
    dialect,
    client: db,

    defineTable(table, contract, mapping, defineOptions) {
      const softDeleteCol =
        defineOptions && "softDeleteColumn" in defineOptions
          ? defineOptions.softDeleteColumn
          : "deletedAt";
      const tableName = getTableName(table);

      const mapped = defineMappedTable(table, contract, mapping, defineOptions);

      const mappingRecord = mapping as Record<string, { name: string }>;
      const idCol = mappingRecord.id;
      const softDeleteColumn = softDeleteCol
        ? (table as unknown as Record<string, { name: string } | undefined>)[softDeleteCol]
        : null;

      const createBoundQuery = <T>(fn: () => Promise<T>): BoundQuery<T> => ({
        get _result() {
          return undefined as T;
        },
        async execute() {
          try {
            return await fn();
          } catch (err) {
            throw parseDbError(err);
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

      const softDeleteCondition = softDeleteColumn ? isNull(softDeleteColumn as never) : undefined;

      const baseWhere = softDeleteCondition ? and(softDeleteCondition) : undefined;

      const dbAny = db as Record<string, unknown>;
      type DbMethod = (...args: unknown[]) => unknown;
      // biome-ignore lint/suspicious/noExplicitAny: Drizzle union workaround for method chaining
      type Chainable = any;
      const select = () => (dbAny.select as DbMethod).call(dbAny) as unknown as Chainable;
      const insert = (t: unknown) =>
        (dbAny.insert as DbMethod).call(dbAny, t) as unknown as Chainable;
      const update = (t: unknown) =>
        (dbAny.update as DbMethod).call(dbAny, t) as unknown as Chainable;
      const del = (t: unknown) => (dbAny.delete as DbMethod).call(dbAny, t) as unknown as Chainable;

      const sql = {
        findById: (id: string) =>
          createBoundQuery(async () => {
            const conditions = idCol
              ? baseWhere
                ? and(eq(idCol as never, id), baseWhere)
                : eq(idCol as never, id)
              : eq((table as Record<string, unknown>).id as never, id);
            const rows = (await select().from(table).where(conditions).limit(1)) as Record<
              string,
              unknown
            >[];
            const row = rows[0];
            return row ? fromDbRow(row) : null;
          }),

        findOne: (where: Partial<InferContract<typeof contract>>) =>
          createBoundQuery(async () => {
            const whereCond = buildWhere(mappingRecord as Record<string, never>, where);
            const fullCond =
              baseWhere && whereCond ? and(baseWhere, whereCond) : (whereCond ?? baseWhere);
            const q = select().from(table);
            const rows = fullCond
              ? ((await q.where(fullCond).limit(1)) as Record<string, unknown>[])
              : ((await q.limit(1)) as Record<string, unknown>[]);
            const row = rows[0];
            return row ? fromDbRow(row) : null;
          }),

        findMany: (where: Partial<InferContract<typeof contract>>) =>
          createBoundQuery(async () => {
            const whereCond = buildWhere(mappingRecord as Record<string, never>, where);
            const fullCond =
              baseWhere && whereCond ? and(baseWhere, whereCond) : (whereCond ?? baseWhere);
            const q = select().from(table);
            const rows = fullCond
              ? ((await q.where(fullCond)) as Record<string, unknown>[])
              : ((await q) as Record<string, unknown>[]);
            return rows.map((r) => fromDbRow(r));
          }),

        create: (data: CreateInput<typeof contract>) =>
          createBoundQuery(async () => {
            const values = toDbValues(data as Record<string, unknown>);
            const result = (await insert(table).values(values).returning()) as Record<
              string,
              unknown
            >[];
            const row = result[0];
            if (!row) throw new Error("Insert did not return row");
            return fromDbRow(row);
          }),

        update: (id: string, data: Partial<InferContract<typeof contract>>) =>
          createBoundQuery(async () => {
            const values = toDbValues(data as Record<string, unknown>);
            const idColumn = idCol ?? (table as Record<string, unknown>).id;
            const result = (await update(table)
              .set(values)
              .where(eq(idColumn as never, id))
              .returning()) as Record<string, unknown>[];
            const row = result[0];
            if (!row) throw new Error("Update did not return row");
            return fromDbRow(row);
          }),

        delete: (id: string) =>
          createBoundQuery(async () => {
            if (softDeleteColumn && softDeleteCol) {
              await update(table)
                .set({
                  [softDeleteCol]: new Date().toISOString(),
                } as Record<string, unknown>)
                .where(eq((idCol ?? (table as Record<string, unknown>).id) as never, id));
            } else {
              await del(table).where(
                eq((idCol ?? (table as Record<string, unknown>).id) as never, id)
              );
            }
          }),

        hardDelete: (id: string) =>
          createBoundQuery(async () => {
            await del(table).where(
              eq((idCol ?? (table as Record<string, unknown>).id) as never, id)
            );
          }),
      };

      (mapped._internal as unknown as Record<string, unknown>).client = db;
      (mapped._internal as unknown as Record<string, unknown>).sql = sql;

      return mapped as DrizzleMappedTable<typeof table, typeof contract>;
    },

    async transaction<T>(fn: (tx: DrizzleAdapter) => Promise<T>): Promise<T> {
      const result = await (
        db as {
          transaction: (fn: (tx: DrizzleClient) => Promise<unknown>) => Promise<unknown>;
        }
      ).transaction(async (tx) => {
        const txAdapter = createDrizzleAdapter(tx, options);
        return fn(txAdapter);
      });
      return result as T;
    },
  };

  return adapter;
}

function inferDialect(db: DrizzleClient): "pg" | "mysql" | "sqlite" {
  const d = db as unknown as Record<string, unknown>;
  const dialect = d?.dialect as { name?: string } | undefined;
  const name = dialect?.name ?? "";
  if (name === "sqlite" || name === "bun-sqlite" || name.includes("sqlite")) return "sqlite";
  if (name === "mysql") return "mysql";
  // Fallback: bun-sqlite and better-sqlite3 use a client with .exec/.run
  const client = d?.client as { exec?: unknown; run?: unknown } | undefined;
  if (client && typeof client.exec === "function") return "sqlite";
  return "pg";
}

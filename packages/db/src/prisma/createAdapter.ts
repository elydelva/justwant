/**
 * Create a Prisma adapter with full CRUD implementation.
 */

import type { AnyContract, InferContract } from "@justwant/contract";
import type { BoundQuery, CreateInput } from "@justwant/db";
import { AdapterMappingError } from "@justwant/db/errors";
import { buildPrismaWhere } from "./buildWhere.js";
import { parsePrismaError } from "./errors.js";
import { mapRowToContract } from "./mapping.js";
import type {
  PrismaAdapter,
  PrismaClient,
  PrismaFindManyOptions,
  PrismaId,
  PrismaMappedTable,
} from "./types.js";

export interface CreatePrismaAdapterOptions {
  /** Override dialect when auto-detection fails. Pass according to schema.prisma provider. */
  dialect?: "pg" | "mysql" | "sqlite";
}

type PrismaDelegate = {
  findUnique: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
  findFirst: (args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    take?: number;
    skip?: number;
  }) => Promise<Record<string, unknown> | null>;
  findMany: (args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[];
    take?: number;
    skip?: number;
  }) => Promise<Record<string, unknown>[]>;
  create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  update: (args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }) => Promise<Record<string, unknown>>;
  delete: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown>>;
};

/**
 * Creates a Prisma adapter for the given PrismaClient.
 */
export function createPrismaAdapter(
  prisma: PrismaClient,
  options?: CreatePrismaAdapterOptions
): PrismaAdapter {
  const dialect = options?.dialect ?? "pg";

  const adapter: PrismaAdapter = {
    dialect,
    client: prisma,

    defineTable(modelName, contract, mapping, defineOptions) {
      const softDeleteCol =
        defineOptions && "softDeleteColumn" in defineOptions
          ? defineOptions.softDeleteColumn
          : "deletedAt";
      const mappingRecord = mapping as Record<string, { name: string }>;

      if (!mappingRecord.id?.name) {
        throw new AdapterMappingError(
          "Mapping must include 'id' field. Example: { id: { name: 'id' }, ... }",
          { field: "id" }
        );
      }
      const idField = mappingRecord.id.name;
      const softDeleteField = softDeleteCol ?? null;

      const delegate = (prisma as Record<string, unknown>)[modelName] as PrismaDelegate;
      if (!delegate || typeof delegate.findUnique !== "function") {
        throw new AdapterMappingError(`Model "${modelName}" not found on PrismaClient`, {
          field: modelName,
        });
      }

      const createBoundQuery = <T>(fn: () => Promise<T>): BoundQuery<T> => ({
        get _result() {
          return undefined as T;
        },
        async execute() {
          try {
            return await fn();
          } catch (err) {
            throw parsePrismaError(err);
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

      const baseWhere = softDeleteField
        ? { [softDeleteField]: null }
        : (undefined as Record<string, unknown> | undefined);

      async function doCreate(
        data: CreateInput<typeof contract>
      ): Promise<InferContract<typeof contract>> {
        const values = toDbValues(data as Record<string, unknown>);
        const row = await delegate.create({ data: values });
        return fromDbRow(row);
      }

      const mergeWhere = (
        userWhere: Record<string, unknown> | undefined
      ): Record<string, unknown> | undefined => {
        if (!baseWhere && !userWhere) return undefined;
        if (!baseWhere) return userWhere;
        if (!userWhere || Object.keys(userWhere).length === 0) return baseWhere;
        return { ...baseWhere, ...userWhere };
      };

      const sql = {
        findById: (id: PrismaId) =>
          createBoundQuery(async () => {
            const where = mergeWhere({ [idField]: id });
            const finalWhere = where ?? { [idField]: id };
            // findUnique only accepts unique fields; with soft delete we need findFirst
            const row = softDeleteField
              ? await delegate.findFirst({ where: finalWhere })
              : await delegate.findUnique({ where: finalWhere });
            return row ? fromDbRow(row) : null;
          }),

        findOne: (where: Partial<InferContract<typeof contract>>) =>
          createBoundQuery(async () => {
            const prismaWhere = buildPrismaWhere(mappingRecord, where as Record<string, unknown>);
            const fullWhere = mergeWhere(
              Object.keys(prismaWhere).length > 0 ? prismaWhere : undefined
            );
            const row = await delegate.findFirst({ where: fullWhere });
            return row ? fromDbRow(row) : null;
          }),

        findMany: (
          where: Partial<InferContract<typeof contract>>,
          options?: PrismaFindManyOptions
        ) =>
          createBoundQuery(async () => {
            const prismaWhere = buildPrismaWhere(mappingRecord, where as Record<string, unknown>);
            const fullWhere = mergeWhere(
              Object.keys(prismaWhere).length > 0 ? prismaWhere : undefined
            );
            const rows = await delegate.findMany({
              where: fullWhere,
              orderBy: options?.orderBy,
              take: options?.take,
              skip: options?.skip,
            });
            return rows.map((r) => fromDbRow(r));
          }),

        create: (data: CreateInput<typeof contract>) => createBoundQuery(() => doCreate(data)),

        update: (id: PrismaId, data: Partial<InferContract<typeof contract>>) =>
          createBoundQuery(async () => {
            const values = toDbValues(data as Record<string, unknown>);
            const row = await delegate.update({
              where: { [idField]: id },
              data: values,
            });
            return fromDbRow(row);
          }),

        delete: (id: PrismaId) =>
          createBoundQuery(async () => {
            if (softDeleteField) {
              await delegate.update({
                where: { [idField]: id },
                data: { [softDeleteField]: new Date() },
              });
            } else {
              await delegate.delete({ where: { [idField]: id } });
            }
          }),

        hardDelete: (id: PrismaId) =>
          createBoundQuery(async () => {
            await delegate.delete({ where: { [idField]: id } });
          }),
      };

      const internal = {
        contract,
        modelName,
        mapping: mappingRecord,
        client: prisma,
        sql,
      };

      return {
        get infer() {
          return undefined as unknown as InferContract<typeof contract>;
        },
        contract,
        _internal: internal,
        create: (data: CreateInput<typeof contract>) => sql.create(data).execute(),
        findById: (id: PrismaId) => sql.findById(id).execute(),
        findOne: (where: Partial<InferContract<typeof contract>>) => sql.findOne(where).execute(),
        findMany: (where: Partial<InferContract<typeof contract>>) => sql.findMany(where).execute(),
        update: (id: PrismaId, data: Partial<InferContract<typeof contract>>) =>
          sql.update(id, data).execute(),
        delete: (id: PrismaId) => sql.delete(id).execute(),
        hardDelete: (id: PrismaId) => sql.hardDelete(id).execute(),
      } as PrismaMappedTable<typeof contract>;
    },

    async transaction<T>(fn: (tx: PrismaAdapter) => Promise<T>): Promise<T> {
      const result = await (
        prisma as {
          $transaction: (fn: (tx: PrismaClient) => Promise<unknown>) => Promise<unknown>;
        }
      ).$transaction(async (tx) => {
        const txAdapter = createPrismaAdapter(tx, options);
        return fn(txAdapter);
      });
      return result as T;
    },
  };

  return adapter;
}

/**
 * Prisma adapter types.
 * Supports pg, mysql, sqlite via PrismaClient.
 */

import type { AnyContract } from "@justwant/contract";
import type { MappedTable, MappedTableInternal } from "@justwant/db";

/** Prisma mapping: contract key → Prisma field name. */
export type PrismaMapping = Record<string, { name: string }>;

/**
 * Any PrismaClient instance. Prisma generates types per project,
 * so we use a generic type for reusability.
 */
// biome-ignore lint/suspicious/noExplicitAny: PrismaClient is project-specific; we need a common interface
export type PrismaClient = any;

export interface PrismaMappedTableInternal<TContract extends AnyContract>
  extends MappedTableInternal<TContract> {
  readonly modelName: string;
  readonly mapping: PrismaMapping;
  readonly client: PrismaClient;
}

export interface PrismaMappedTable<TContract extends AnyContract> extends MappedTable<TContract> {
  readonly _internal: PrismaMappedTableInternal<TContract>;
}

export interface PrismaAdapter {
  readonly dialect: "pg" | "mysql" | "sqlite";
  readonly client: PrismaClient;

  defineTable<TContract extends AnyContract>(
    modelName: string,
    contract: TContract,
    mapping: PrismaMapping,
    options?: DefinePrismaTableOptions
  ): PrismaMappedTable<TContract>;

  transaction<T>(fn: (tx: PrismaAdapter) => Promise<T>): Promise<T>;
}

export interface DefinePrismaTableOptions {
  /** Column name for soft delete. Default 'deletedAt'. Set to null to disable. */
  softDeleteColumn?: string | null;
}

/** Options for findMany: orderBy, pagination. */
export interface PrismaFindManyOptions {
  orderBy?: Record<string, "asc" | "desc">;
  take?: number;
  skip?: number;
}

/**
 * Prisma where value: primitive or filter object (in, contains, startsWith, etc.).
 * Use for advanced filtering in findOne/findMany.
 */
export type PrismaWhereValue =
  | string
  | number
  | boolean
  | null
  | Date
  | { in?: unknown[]; not?: unknown; equals?: unknown }
  | { contains?: string; startsWith?: string; endsWith?: string; mode?: "insensitive" }
  | {
      gt?: string | number | Date;
      gte?: string | number | Date;
      lt?: string | number | Date;
      lte?: string | number | Date;
    };

/** ID type for findById, update, delete. Prisma supports string (uuid) and number (int). */
export type PrismaId = string | number;

import type { AnyContract } from "@justwant/contract";
import type { MappedTable } from "./table.js";

export interface BaseAdapter {
  readonly dialect: "pg" | "mysql" | "sqlite";

  defineTable<TSource, TContract extends AnyContract>(
    source: TSource,
    contract: TContract,
    mapping: unknown
  ): MappedTable<TContract>;

  transaction<T>(fn: (tx: this) => Promise<T>): Promise<T>;
}

export interface PackageAdapter<TContract extends AnyContract> {
  table: MappedTable<TContract>;
}

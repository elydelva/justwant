import type { AnyContract, InferContract } from "./contract.js";

/**
 * Represents a deferred query. Execution is lazy — call execute() to run.
 * Implementations (e.g. adapter-drizzle) construct these; no factory in this package.
 *
 * @see docs/CONTRACT.md for construction guidance.
 */
export interface BoundQuery<TResult> {
  readonly _result: TResult;
  execute(): Promise<TResult>;
}

/**
 * Input for create operations. Excludes common auto-generated fields.
 * Override the excluded keys if your schema uses different names.
 */
export type CreateInput<TContract extends AnyContract> = Omit<
  InferContract<TContract>,
  "id" | "createdAt" | "updatedAt"
>;

export interface MappedTableInternal<TContract extends AnyContract> {
  readonly contract: TContract;
  readonly sql: {
    findById(id: string): BoundQuery<InferContract<TContract> | null>;
    findOne(where: Partial<InferContract<TContract>>): BoundQuery<InferContract<TContract> | null>;
    findMany(where: Partial<InferContract<TContract>>): BoundQuery<InferContract<TContract>[]>;
    create(data: CreateInput<TContract>): BoundQuery<InferContract<TContract>>;
    update(
      id: string,
      data: Partial<InferContract<TContract>>
    ): BoundQuery<InferContract<TContract>>;
    /** Soft delete — marks as deleted, preserves row. */
    delete(id: string): BoundQuery<void>;
    /** Hard delete — removes row permanently. */
    hardDelete(id: string): BoundQuery<void>;
  };
}

export interface MappedTable<TContract extends AnyContract> {
  readonly infer: InferContract<TContract>;
  readonly contract: TContract;
  readonly _internal: MappedTableInternal<TContract>;
}

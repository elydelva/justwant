/**
 * Contract definitions for adapter mapping.
 * FieldDef supports field builders (uuid, string, email, etc.) with DDL metadata.
 *
 * @see docs/CONTRACT.md for invariants and edge cases.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Generic contract type. All contracts must be Record<string, FieldDef<unknown, boolean>>.
 */
export type AnyContract = Record<string, FieldDef<unknown, boolean>>;

export type FieldDef<T, Req extends boolean> = {
  readonly _type: T;
  readonly _required: Req;
  readonly _nullable: boolean;
  readonly _columnType?: string;
  readonly _schema?: StandardSchemaV1<unknown, T>;
  readonly _primaryKey?: boolean;
  readonly _unique?: boolean;
  readonly _default?: string;
};

/** Infer entity type from contract fields. */
type InferContractFromFields<TContract extends AnyContract> = {
  [K in keyof TContract as TContract[K]["_required"] extends true
    ? K
    : never]: TContract[K]["_type"];
} & {
  [K in keyof TContract as TContract[K]["_required"] extends false
    ? K
    : never]?: TContract[K]["_type"];
};

/**
 * Infers the entity type from a contract.
 * Accepts TableContract (uses .fields) or legacy AnyContract.
 */
export type InferContract<T> = T extends { fields: infer F }
  ? F extends AnyContract
    ? InferContractFromFields<F>
    : never
  : T extends AnyContract
    ? InferContractFromFields<T>
    : never;

/** Alias for InferContract — shorter when using TableContract. */
export type Infer<T extends AnyContract | { fields: AnyContract }> = InferContract<T>;

/** Table fields = record of field definitions (from field builders). */
export type TableFields = Record<string, FieldDef<unknown, boolean>>;

/**
 * @deprecated Use uuid(), string(), email(), etc. from fieldBuilder
 */
export const field = <T>() => ({
  required: (): FieldDef<T, true> =>
    ({ _type: undefined as T, _required: true, _nullable: false }) as FieldDef<T, true>,
  optional: (): FieldDef<T, false> =>
    ({ _type: undefined as T, _required: false, _nullable: true }) as FieldDef<T, false>,
});

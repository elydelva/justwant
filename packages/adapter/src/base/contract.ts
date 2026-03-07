/**
 * Pure contract definitions for adapter mapping.
 * Zero runtime dependencies — types only flow through InferContract.
 *
 * @see docs/CONTRACT.md for invariants and edge cases.
 */

/**
 * Generic contract type. All contracts must be Record<string, FieldDef<unknown, boolean>>.
 * Edge cases: empty contract `{}` is valid; index signatures are not supported.
 */
export type AnyContract = Record<string, FieldDef<unknown, boolean>>;

export type FieldDef<T, Req extends boolean> = {
  readonly _type: T;
  readonly _required: Req;
  readonly _nullable: boolean;
};

export const field = <T>() => ({
  required: (): FieldDef<T, true> =>
    ({ _type: undefined as T, _required: true, _nullable: false }) as FieldDef<T, true>,
  optional: (): FieldDef<T, false> =>
    ({ _type: undefined as T, _required: false, _nullable: true }) as FieldDef<T, false>,
});

export type InferContract<TContract extends AnyContract> = {
  [K in keyof TContract as TContract[K]["_required"] extends true
    ? K
    : never]: TContract[K]["_type"];
} & {
  [K in keyof TContract as TContract[K]["_required"] extends false
    ? K
    : never]?: TContract[K]["_type"];
};

export function defineContract<T extends AnyContract>(contract: T): T {
  return contract;
}

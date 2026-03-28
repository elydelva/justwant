/**
 * Field builder for defineContract.
 * Produces FieldDef with column type, optional Standard Schema validation.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  emailSchema,
  hostnameSchema,
  ipSchema,
  ipv4Schema,
  ipv6Schema,
  slugSchema,
  urlSchema,
  uuidSchema,
} from "./schemas.js";

export interface FieldBuilderState<T> {
  readonly _type: T;
  readonly _columnType: string;
  readonly _kind?: "date" | "string" | "uuid" | "json";
  readonly _required: boolean;
  readonly _nullable: boolean;
  readonly _schema?: StandardSchemaV1<unknown, T>;
  readonly _primaryKey?: boolean;
  readonly _unique?: boolean;
  readonly _default?: string;
}

export interface FieldBuilder<T> extends FieldBuilderState<T> {
  required(): FieldBuilder<T>;
  optional(): FieldBuilder<T>;
  primaryKey(): FieldBuilder<T>;
  unique(): FieldBuilder<T>;
  default(val: string): FieldBuilder<T>;
  schema<S>(s: StandardSchemaV1<unknown, S>): FieldBuilder<S>;
}

function createFieldBuilder<T>(state: FieldBuilderState<T>): FieldBuilder<T> {
  return {
    ...state,
    required() {
      return createFieldBuilder<T>({
        ...state,
        _required: true,
        _nullable: false,
      });
    },
    optional() {
      return createFieldBuilder<T>({
        ...state,
        _required: false,
        _nullable: true,
      });
    },
    primaryKey() {
      return createFieldBuilder<T>({ ...state, _primaryKey: true });
    },
    unique() {
      return createFieldBuilder<T>({ ...state, _unique: true });
    },
    default(val: string) {
      return createFieldBuilder<T>({ ...state, _default: val });
    },
    schema<S>(s: StandardSchemaV1<unknown, S>) {
      return createFieldBuilder<S>({
        ...state,
        _schema: s,
        _type: undefined as S,
      });
    },
  };
}

function fieldBuilder<T>(
  columnType: string,
  schema?: StandardSchemaV1<unknown, T>,
  kind?: FieldBuilderState<T>["_kind"]
): FieldBuilder<T> {
  return createFieldBuilder<T>({
    _type: undefined as T,
    _columnType: columnType,
    _kind: kind,
    _required: false,
    _nullable: true,
    _schema: schema,
  });
}

/** Primitives */
export const uuid = () => fieldBuilder<string>("TEXT", uuidSchema, "uuid");
export const string = () => fieldBuilder<string>("TEXT", undefined, "string");
export const number = () => fieldBuilder<number>("REAL");
export const integer = () => fieldBuilder<number>("INTEGER");
export const boolean = () => fieldBuilder<boolean>("INTEGER");
export const date = () => fieldBuilder<Date>("TEXT", undefined, "date");
export const json = () => fieldBuilder<unknown>("TEXT", undefined, "json");

/** Semantic (sugar for string().schema(...)) */
export const email = () => string().schema(emailSchema);
export const url = () => string().schema(urlSchema);
export const ip = () => string().schema(ipSchema);
export const ipv4 = () => string().schema(ipv4Schema);
export const ipv6 = () => string().schema(ipv6Schema);
export const hostname = () => string().schema(hostnameSchema);
export const slug = () => string().schema(slugSchema);

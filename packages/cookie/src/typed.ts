import type { CookieAdapter } from "./adapters/index.js";
import { parseCookies, serializeCookie } from "./primitive.js";
import type { CookieOptions } from "./types.js";

/** Standard Schema compatible (Zod, Valibot, etc.). validate returns { value?, issues? } */
export interface CookieSchema<T = unknown> {
  "~standard"?: {
    validate: (
      v: unknown
    ) =>
      | { value?: T; issues?: readonly { message?: string }[] }
      | Promise<{ value?: T; issues?: readonly { message?: string }[] }>;
  };
}

/** When validation fails: fallback = use default, remove = use default + delete cookie */
export type OnMismatch = "fallback" | "remove";

export interface DefineCookieOptions<T = string> {
  /** Standard Schema for validation (Zod, Valibot, etc.) */
  schema?: CookieSchema<T>;
  /** Fallback when value is undefined or validation fails */
  default?: T;
  /** When validation fails: "fallback" = use default; "remove" = use default + delete cookie */
  onMismatch?: OnMismatch;
  /** Custom parser (alternative to schema). Receives raw string, returns parsed value. */
  parser?: (value: string | undefined) => T;
}

export interface TypedCookie<T = string> {
  readonly name: string;
  readonly default?: T;
  readonly onMismatch?: OnMismatch;
  parse(value: string | undefined): T;
  /** When true, adapter should delete this cookie (invalid value, onMismatch=remove) */
  parseWithMeta(value: string | undefined): { value: T; remove?: boolean };
}

function validateSchema<T>(schema: CookieSchema<T>, value: unknown): { valid: boolean; value?: T } {
  const std = schema["~standard"];
  if (!std?.validate) return { valid: true, value: value as T };
  const result = std.validate(value);
  if (result && typeof (result as Promise<unknown>).then === "function") {
    return { valid: false };
  }
  const r = result as { value?: T; issues?: readonly unknown[] };
  if (r.issues?.length) return { valid: false };
  return { valid: true, value: r.value };
}

export function defineCookie<T = string>(
  name: string,
  parserOrOptions?: ((value: string | undefined) => T) | DefineCookieOptions<T>
): TypedCookie<T> {
  const isParser = typeof parserOrOptions === "function";
  const parser = isParser ? parserOrOptions : undefined;
  const opts = isParser ? undefined : (parserOrOptions as DefineCookieOptions<T>);
  const schema = opts?.schema;
  const defaultValue = opts?.default;
  const onMismatch = opts?.onMismatch ?? (defaultValue === undefined ? undefined : "fallback");

  const parseWithMeta = (raw: string | undefined): { value: T; remove?: boolean } => {
    if (schema) {
      const v = raw !== undefined && raw !== "" ? raw : undefined;
      const { valid, value } = validateSchema(schema, v);
      if (!valid) {
        const fallback = defaultValue as T;
        return { value: fallback, remove: onMismatch === "remove" };
      }
      return { value: (value ?? defaultValue) as T };
    }
    if (parser) {
      const value = parser(raw);
      return { value };
    }
    return { value: (raw ?? defaultValue ?? "") as T };
  };

  const parse = (raw: string | undefined): T => parseWithMeta(raw).value;

  return {
    name,
    default: defaultValue,
    onMismatch,
    parse,
    parseWithMeta,
  };
}

export function setCookie(name: string, value: string, options?: CookieOptions): string {
  return serializeCookie(name, value, options);
}

export function deleteCookie(
  name: string,
  options?: Pick<CookieOptions, "path" | "domain">
): string {
  return serializeCookie(name, "", { ...options, maxAge: 0 });
}

export type InferCookieStore<T extends Record<string, TypedCookie<unknown>>> = {
  [K in keyof T]: T[K] extends TypedCookie<infer V> ? V : never;
};

export interface CookieStore<T extends Record<string, TypedCookie<unknown>>> {
  parse(header: string | null | undefined): InferCookieStore<T>;
  serialize<K extends keyof T>(
    name: K,
    value: InferCookieStore<T>[K],
    options?: CookieOptions
  ): string;
  /** When adapter is provided: get reads from adapter, set writes to adapter */
  get?(): InferCookieStore<T>;
  set?<K extends keyof T>(name: K, value: InferCookieStore<T>[K], options?: CookieOptions): void;
}

export interface CreateCookieStoreOptions<T extends Record<string, TypedCookie<unknown>>> {
  adapter?: CookieAdapter;
  /** When true, delete cookies not in schema on get (requires adapter). Use path/domain for delete scope. Default: false */
  pruneUntracked?: boolean | Pick<CookieOptions, "path" | "domain">;
}

export function createCookieStore<T extends Record<string, TypedCookie<unknown>>>(
  cookies: T,
  options?: CreateCookieStoreOptions<T>
): CookieStore<T> {
  const entries = Object.entries(cookies) as [keyof T, TypedCookie<unknown>][];
  const adapter = options?.adapter;
  const pruneOpt = options?.pruneUntracked;
  const pruneUntracked = !!pruneOpt;
  let pruneDeleteOpts: Pick<CookieOptions, "path" | "domain"> | undefined;
  if (pruneOpt === true) pruneDeleteOpts = { path: "/" };
  else if (typeof pruneOpt === "object") pruneDeleteOpts = pruneOpt;
  else pruneDeleteOpts = undefined;
  const trackedNames = new Set(entries.map(([, c]) => c.name));

  const parseFromHeader = (
    header: string | null | undefined,
    opts?: { applyRemove?: boolean }
  ): InferCookieStore<T> => {
    const raw = parseCookies(header);
    const result = {} as InferCookieStore<T>;
    const toRemove: string[] = [];

    for (const [key, cookie] of entries) {
      const name = cookie.name;
      const rawValue = raw[name];
      const { value, remove } = cookie.parseWithMeta(rawValue);
      result[key as keyof InferCookieStore<T>] = value as InferCookieStore<T>[keyof T];
      if (remove && opts?.applyRemove && adapter) {
        toRemove.push(name);
      }
    }

    if (opts?.applyRemove && adapter) {
      for (const name of toRemove) {
        adapter.write(name, "", { maxAge: 0 });
      }
    }

    if (pruneUntracked && adapter && pruneDeleteOpts) {
      for (const name of Object.keys(raw)) {
        if (!trackedNames.has(name)) {
          adapter.write(name, "", { ...pruneDeleteOpts, maxAge: 0 });
        }
      }
    }

    return result;
  };

  const store: CookieStore<T> = {
    parse(header) {
      return parseFromHeader(header);
    },
    serialize(name, value, opts) {
      const cookie = cookies[name];
      if (!cookie) throw new Error(`Unknown cookie: ${String(name)}`);
      return serializeCookie(cookie.name, String(value), opts);
    },
  };

  if (adapter) {
    store.get = () => parseFromHeader(adapter.read(), { applyRemove: true });
    store.set = (name, value, opts) => {
      const cookie = cookies[name];
      if (!cookie) throw new Error(`Unknown cookie: ${String(name)}`);
      adapter.write(cookie.name, String(value), opts);
    };
  }

  return store;
}

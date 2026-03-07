# Contract invariants

## FieldDef

- **`_required: true`** — Field is required in create/update. Must be present.
- **`_required: false`** — Field is optional. Can be omitted.
- **`_nullable: true`** — Optional fields. At read time, DB `null` → JS `undefined`.
- **`_nullable: false`** — Required fields. Never null.

## BoundQuery

- **Lazy execution** — Queries are not run until `execute()` is called.
- **Transaction context** — When inside `adapter.transaction(fn)`, `execute()` uses the transaction context. Implementations must propagate this.
- **No factory** — This package does not provide `createBoundQuery()`. Implementations (e.g. `@justwant/db/drizzle`) construct `BoundQuery` objects. Example:

  ```ts
  const q: BoundQuery<T> = {
    get _result() { return undefined as T },
    async execute() { return /* run query */ }
  }
  ```

## MappedTableInternal.sql

- **delete(id)** — Soft delete. Marks row as deleted, preserves data. Typically sets `deleted_at` or similar.
- **hardDelete(id)** — Hard delete. Removes row permanently.

## CreateInput

- Excludes `id`, `createdAt`, `updatedAt` by default. Override if your schema uses different column names.

## AnyContract

- Must be `Record<string, FieldDef<unknown, boolean>>`.
- Empty contract `{}` is valid.
- Index signatures are not supported.

# 01 — @justwant/db — Contrats purs

## Objectif

Package de base contenant **uniquement les contrats et types** que tous les adapters implémentent. Zéro dépendance — pas de Drizzle, pas de Prisma.

## Contenu

### Contrat de champ

```ts
// @justwant/db/contract.ts
export type FieldDef<T, Req extends boolean> = {
  _type:     T
  _required: Req
  _nullable: boolean
}

export const field = <T>() => ({
  required: (): FieldDef<T, true>  => ({ _type: undefined as T, _required: true,  _nullable: false }),
  optional: (): FieldDef<T, false> => ({ _type: undefined as T, _required: false, _nullable: true  }),
})

export type InferContract<TContract extends AnyContract> = {
  [K in keyof TContract as TContract[K]['_required'] extends true ? K : never]:
    TContract[K]['_type']
} & {
  [K in keyof TContract as TContract[K]['_required'] extends false ? K : never]?:
    TContract[K]['_type']
}

export function defineContract<T extends AnyContract>(contract: T): T {
  return contract
}
```

### Interface MappedTable

```ts
// @justwant/db/table.ts
export interface MappedTable<TContract extends AnyContract> {
  readonly infer: InferContract<TContract>
  readonly contract: TContract
  readonly _internal: MappedTableInternal<TContract>
}

export interface MappedTableInternal<TContract extends AnyContract> {
  readonly contract: TContract
  readonly sql: {
    findById(id: string): BoundQuery<InferContract<TContract> | null>
    findOne(where: Partial<InferContract<TContract>>): BoundQuery<InferContract<TContract> | null>
    findMany(where: Partial<InferContract<TContract>>): BoundQuery<InferContract<TContract>[]>
    create(data: Omit<InferContract<TContract>, 'id' | 'createdAt'>): BoundQuery<InferContract<TContract>>
    update(id: string, data: Partial<InferContract<TContract>>): BoundQuery<InferContract<TContract>>
    delete(id: string): BoundQuery<void>
  }
}

export interface BoundQuery<TResult> {
  readonly _result: TResult
  execute(): Promise<TResult>
}
```

### Interface BaseAdapter

```ts
// @justwant/db/adapter.ts
export interface BaseAdapter {
  readonly dialect: 'pg' | 'mysql' | 'sqlite'

  defineTable<TSource, TContract extends AnyContract>(
    source:   TSource,
    contract: TContract,
    mapping:  unknown,
  ): MappedTable<TContract>

  transaction<T>(fn: (tx: this) => Promise<T>): Promise<T>
}

export interface PackageAdapter<TContract extends AnyContract> {
  table: MappedTable<TContract>
}
```

## Hiérarchie

```
@justwant/db
  defineContract, field, InferContract
  MappedTable, MappedTableInternal, BoundQuery
  BaseAdapter, PackageAdapter
  → zéro dépendance externe
        ↓ étendu par
@justwant/db/drizzle
@justwant/db/prisma
@justwant/db-custom (communauté)
        ↓ consommé par
@justwant/auth, @justwant/audit, @justwant/keys...
  → voient uniquement MappedTable<TContract>
```

## Point clé

Les packages de feature ne connaissent **jamais** les types Drizzle ou Prisma. Ils consomment uniquement `MappedTable<TContract>` — l'adapter concret est transparent.

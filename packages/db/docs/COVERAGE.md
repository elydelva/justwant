# Couverture des tests — @justwant/db

## Résumé

| Module | Spec | Couverture estimée | Lacunes |
|--------|------|-------------------|---------|
| **base/** | | | |
| contract.ts | contract.spec.ts | ✓ | — |
| tableContract.ts | tableContract.spec.ts | ✓ | — |
| table.ts | table.spec.ts | ✓ | — |
| conforms.ts | conforms.spec.ts | ✓ | — |
| validate.ts | validate.spec.ts | ✓ | — |
| schemas.ts | schemas.spec.ts | ✓ | — |
| fieldBuilder.ts | via tableContract, validate | ✓ | — |
| fields.ts | réexport | ✓ | — |
| errors.ts | adapter.spec.ts | ✓ | — |
| adapter.ts | adapter.spec.ts | ✓ | — |
| **waddler/** | | | |
| core.ts | createAdapter.spec.ts, integration.spec.ts | ✓ | buildWhere, buildOrderBy (indirect) |
| errors.ts | errors.spec.ts | ✓ | — |
| buildWhere.ts | via createAdapter | ✓ | — |
| mapping.ts | via drizzle/mapping.spec | ✓ | — |
| **drizzle/** | | | |
| createAdapter.ts | createAdapter.spec.ts | ✓ | — |
| buildWhere, buildOrderBy, buildPagination | *.spec.ts | ✓ | — |
| mapping, upsert, bulkInsert, collectSchemas | *.spec.ts | ✓ | — |
| errors.ts | errors.spec.ts | ✓ | — |
| **prisma/** | | | |
| createAdapter.ts | createAdapter.spec.ts | ✓ | — |
| buildWhere, mapping, upsert, bulkInsert | *.spec.ts | ✓ | — |
| errors.ts | errors.spec.ts | ✓ | — |

## Fichiers sans spec dédié

- **Entry points** (bun-sqlite, pg, neon, etc.) : wrappers minces autour de `createWaddlerAdapter`, couverts par les tests d’intégration.
- **fieldBuilder.ts** : couvert via tableContract (defineContract avec field builders) et validate (email, uuid).
- **waddler/buildOrderBy.ts** : non utilisé par le core waddler actuel ; couvert si utilisé via drizzle.

## Tests E2E / intégration

- `waddler/integration.spec.ts` : CRUD complet avec bun-sqlite.
- `prisma/integration.spec.ts` : CRUD avec Prisma.
- `drizzle/createAdapter.spec.ts` : CRUD avec Drizzle + SQLite.

## Verdict

**Couverture suffisante** pour un package DAL :

1. **API publique** : create, findById, findOne, findMany, update, delete, createSafe, updateSafe, table(), createTable() sont testés.
2. **Validation** : validateContractData, ContractValidationError, createSafe couverts.
3. **Conformité** : assertTableConforms, conformsTo, tableConforms couverts.
4. **Erreurs** : hiérarchie AdapterError et parseWaddlerError/parseDbError couvertes.
5. **Schémas** : uuid, email, url, ipv4, slug validés.

## Recommandations

1. **Coverage threshold** : ajouter `coverageThreshold = 0.8` dans `bunfig.toml` pour bloquer les merges si la couverture baisse.
2. **Tests manquants** : `updateSafe` avec validation échouée (retourne `{ ok: false }`).
3. **E2E multi-dialecte** : un test pg ou mysql en CI si possible.

# @justwant/core

## [0.2.0](https://github.com/elydelva/justwant/compare/core-v0.1.0...core-v0.2.0) (2026-03-28)


### Features

* **core:** add @justwant/core package with shared SQL utilities ([2b5636e](https://github.com/elydelva/justwant/commit/2b5636e376ec04087c1d8ede2d089a7270069b84))
* **core:** introduce @justwant/core and eliminate SQL utility duplication across db and warehouse ([8d4d596](https://github.com/elydelva/justwant/commit/8d4d596b7a69203173ebec4148ce63d6ae8912fa))


### Bug Fixes

* **core:** correct mapRowToContract test assertion ([a2c18b0](https://github.com/elydelva/justwant/commit/a2c18b010929a1004b4a597860515c7ddce1978f))

## 0.1.0

### Minor Changes

- Initial release: shared SQL utilities for `@justwant/db` and `@justwant/warehouse`.

  **`@justwant/core/db`**

  - `WaddlerSql`, `WaddlerQuery`: shared Waddler SQL client interfaces.
  - `StringMapping`, `ContractStringMapping`: contract key → column name mapping types.
  - `ColumnLike`: minimal column interface for row mapping.
  - `mapRowToContract`: maps DB rows to contract shape, handles null → undefined and ISO date string → Date conversion.
  - `mapContractToRow`: maps contract rows to DB column values, converts Date → ISO string.
  - `appendWhere`: appends parameterized WHERE conditions to a Waddler query.
  - `appendOrderBy`: appends ORDER BY clause to a Waddler query.
  - `escapeIdentifier`: double-quote SQL identifier escaping.
  - `escapeStringLiteral`: single-quote SQL string literal escaping.

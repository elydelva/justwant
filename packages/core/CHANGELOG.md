# @justwant/core

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

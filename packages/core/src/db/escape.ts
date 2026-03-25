/**
 * SQL identifier and string literal escaping helpers.
 */

/** Escapes a SQL identifier with double quotes. */
export function escapeIdentifier(name: string): string {
  return `"${String(name).replaceAll('"', '""')}"`;
}

/** Escapes a SQL string literal with single quotes. */
export function escapeStringLiteral(value: string): string {
  return `'${String(value).replaceAll("'", "''")}'`;
}

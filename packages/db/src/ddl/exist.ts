/**
 * SQL to check if a table exists.
 */

import { escapeStringLiteral } from "@justwant/core/db";
import type { SqlDialect } from "./index.js";

export function getExistTableSQL(tableName: string, dialect: SqlDialect, schema?: string): string {
  if (dialect === "sqlite") {
    return `SELECT EXISTS (SELECT 1 FROM sqlite_schema WHERE type='table' AND name=${escapeStringLiteral(tableName)})`;
  }
  if (dialect === "pg") {
    const schemaVal = schema ?? "public";
    return `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ${escapeStringLiteral(schemaVal)} AND table_name = ${escapeStringLiteral(tableName)})`;
  }
  if (dialect === "mysql") {
    return `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ${escapeStringLiteral(tableName)})`;
  }
  throw new Error(`Unsupported dialect: ${dialect}`);
}

/**
 * E2E helpers for availability checks.
 * Used by integration tests to skip when Docker DBs are not running.
 */

export const POSTGRES_URL =
  process.env.POSTGRES_URL ?? "postgres://test:test@localhost:5432/justwant_test";
export const MYSQL_URL = process.env.MYSQL_URL ?? "mysql://test:test@localhost:3306/justwant_test";

export async function hasPostgres(): Promise<boolean> {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: POSTGRES_URL });
    await pool.query("SELECT 1");
    await pool.end();
    return true;
  } catch {
    return false;
  }
}

export async function hasMysql(): Promise<boolean> {
  try {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection(MYSQL_URL);
    await conn.query("SELECT 1");
    await conn.end();
    return true;
  } catch {
    return false;
  }
}

export function skipIf(condition: boolean, message: string): void {
  if (condition) {
    console.log(`Skipping E2E: ${message}`);
  }
}

/**
 * E2E helpers for availability checks.
 * Used by integration tests to skip when Docker ClickHouse is not running.
 */

export const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL ?? "http://localhost:8123";

export async function hasClickHouse(): Promise<boolean> {
  try {
    const res = await fetch(`${CLICKHOUSE_URL}/ping`);
    return res.ok;
  } catch {
    return false;
  }
}

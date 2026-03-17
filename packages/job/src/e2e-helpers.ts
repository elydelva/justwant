/**
 * E2E helpers for availability checks.
 * Used by integration tests to skip when Docker services are not running.
 */

export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
export const POSTGRES_URL =
  process.env.POSTGRES_URL ?? "postgres://test:test@localhost:5432/justwant_test";
export const QSTASH_URL = process.env.QSTASH_URL ?? "http://127.0.0.1:8080";

export async function hasRedis(): Promise<boolean> {
  try {
    const Redis = (await import("ioredis")).default;
    const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 });
    await redis.ping();
    redis.disconnect();
    return true;
  } catch {
    return false;
  }
}

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

export async function hasQStashDev(): Promise<boolean> {
  try {
    const res = await fetch(`${QSTASH_URL}/v2/health`);
    return res.ok;
  } catch {
    return false;
  }
}

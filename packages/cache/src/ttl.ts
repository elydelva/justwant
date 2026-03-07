import type { TTL } from "./types.js";

const UNITS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const STRING_REGEX = /^(\d+)(s|m|h|d)$/i;

/**
 * Parse TTL to milliseconds from now, or return a Date for absolute expiry.
 * - string: '30s', '5m', '2h', '7d' → ms from now
 * - number: already ms → return as-is
 * - Date: absolute expiry → return as Date (caller handles)
 */
export function parseTtl(ttl: TTL | undefined, now = Date.now()): number | Date | undefined {
  if (ttl === undefined || ttl === null) return undefined;
  if (typeof ttl === "number") return ttl;
  if (ttl instanceof Date) return ttl;
  if (typeof ttl !== "string") return undefined;

  const match = ttl.trim().match(STRING_REGEX);
  if (!match) return undefined;

  const value = Number.parseInt(match[1] ?? "0", 10);
  const unit = (match[2] ?? "s").toLowerCase();
  const ms = UNITS[unit];
  if (!ms || !Number.isFinite(value) || value < 0) return undefined;

  return value * ms;
}

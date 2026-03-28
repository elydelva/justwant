/**
 * @justwant/flag — hashContext
 * Hash context (string or object) to a value in [0,1] for rollout.
 * Uses @justwant/crypto for deterministic SHA-256 hashing.
 */

import { hashString } from "@justwant/crypto/hash";

function toStableString(value: string | Record<string, unknown>): string {
  if (typeof value === "string") return value;
  const keys = Object.keys(value).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const parts = keys.map((k) => `${k}:${JSON.stringify(value[k])}`);
  return parts.join("|");
}

/**
 * Hash a context (string or object) to a deterministic value in [0,1].
 * Use with rollout: rollout(hashContext(userId), threshold)
 * or rollout(hashContext({ userId, orgId }), threshold).
 */
export function hashContext(context: string | Record<string, unknown>): number {
  const str = toStableString(context);
  const hex = hashString(str);
  const slice = hex.slice(0, 13);
  const value = Number.parseInt(slice, 16);
  return value / 0x10000000000000;
}

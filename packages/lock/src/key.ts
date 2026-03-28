/**
 * @justwant/lock — Internal key serialization
 * Deterministic: Record keys sorted alphabetically.
 */

export function serializeParams(params: string | Record<string, string>): string {
  if (typeof params === "string") return params;
  return Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => `${k}:${params[k]}`)
    .join(":");
}

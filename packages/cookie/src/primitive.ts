import type { CookieOptions } from "./types.js";

export type { CookieOptions } from "./types.js";

/**
 * Parse Cookie header string into Record<name, value>.
 * Handles URL-decoded values per RFC 6265.
 */
export function parseCookies(header: string | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header || typeof header !== "string") return result;

  const pairs = header.split(";");
  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex <= 0) continue;
    const name = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    if (!name) continue;
    try {
      result[name] = decodeURIComponent(value);
    } catch {
      result[name] = value;
    }
  }
  return result;
}

/**
 * Serialize name=value with options into Set-Cookie header value.
 */
export function serializeCookie(name: string, value: string, options?: CookieOptions): string {
  const parts: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options?.path) parts.push(`Path=${options.path}`);
  if (options?.domain) parts.push(`Domain=${options.domain}`);
  if (options?.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options?.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options?.httpOnly) parts.push("HttpOnly");
  if (options?.secure) parts.push("Secure");
  if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);

  return parts.join("; ");
}

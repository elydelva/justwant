import type { CookieOptions } from "../types.js";
import type { CookieAdapter } from "./types.js";

/**
 * Next.js cookie store options (compatible with our CookieOptions).
 * Next.js 15+ adds: priority, partitioned.
 */
export interface NextJSSetOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
  priority?: "low" | "medium" | "high";
  partitioned?: boolean;
}

/**
 * Next.js App Router cookie store (from await cookies()).
 * Compatible with Next.js 14+ (sync) and 15+ (async).
 */
export interface NextJSCookieStore {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: NextJSSetOptions): void;
}

function mapOptionsToNextJS(opts?: CookieOptions): NextJSSetOptions | undefined {
  if (!opts) return undefined;
  const { path, domain, maxAge, expires, secure, httpOnly, sameSite } = opts;
  const o: NextJSSetOptions = {};
  if (path !== undefined) o.path = path;
  if (domain !== undefined) o.domain = domain;
  if (maxAge !== undefined) o.maxAge = maxAge;
  if (expires !== undefined) o.expires = expires;
  if (secure !== undefined) o.secure = secure;
  if (httpOnly !== undefined) o.httpOnly = httpOnly;
  if (sameSite !== undefined) o.sameSite = sameSite;
  return Object.keys(o).length > 0 ? o : undefined;
}

/**
 * Adapter for Next.js App Router.
 * Usage: const cookieStore = await cookies(); const adapter = NextJSAdapter(cookieStore);
 */
export function NextJSAdapter(cookieStore: NextJSCookieStore): CookieAdapter {
  return {
    read() {
      const all = cookieStore.getAll();
      return all
        .map((c) => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`)
        .join("; ");
    },
    write(name, value, options) {
      cookieStore.set(name, value, mapOptionsToNextJS(options));
    },
  };
}

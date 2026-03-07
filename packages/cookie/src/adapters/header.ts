import { serializeCookie } from "../primitive.js";
import type { CookieAdapter } from "./types.js";

/**
 * Adapter for generic header-based read/write (Node, Deno, fetch, etc.).
 */
export function HeaderAdapter(options: {
  getCookie: () => string;
  appendSetCookie: (value: string) => void;
}): CookieAdapter {
  return {
    read: options.getCookie,
    write(name, value, opts) {
      options.appendSetCookie(serializeCookie(name, value, opts));
    },
  };
}

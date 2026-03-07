import type { CookieOptions } from "../types.js";

export interface CookieAdapter {
  read(): string;
  write(name: string, value: string, options?: CookieOptions): void;
}

/** Minimal document-like interface for cookie read/write */
export interface DocumentLike {
  cookie: string;
}

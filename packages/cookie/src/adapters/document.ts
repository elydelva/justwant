import { serializeCookie } from "../primitive.js";
import type { CookieAdapter, DocumentLike } from "./types.js";

/**
 * Adapter for document.cookie (browser).
 * Pass document explicitly or omit to use global (browser only).
 */
export function DocumentAdapter(doc?: DocumentLike): CookieAdapter {
  const documentRef =
    doc ??
    (typeof globalThis !== "undefined" && "document" in globalThis
      ? (globalThis as unknown as { document: DocumentLike }).document
      : undefined);

  return {
    read() {
      return documentRef?.cookie ?? "";
    },
    write(name, value, options) {
      if (documentRef) {
        documentRef.cookie = serializeCookie(name, value, options);
      }
    },
  };
}

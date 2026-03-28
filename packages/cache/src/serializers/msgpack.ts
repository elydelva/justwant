import type { CacheSerializer } from "../types.js";

/**
 * MessagePack serializer. Compact binary format.
 * Requires '@msgpack/msgpack' as peer dependency.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCodePoint(b);
  }
  return btoa(binary);
}

function base64ToBytes(s: string): Uint8Array {
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.codePointAt(i) ?? 0;
  }
  return bytes;
}

export function msgpackSerializer(): CacheSerializer {
  try {
    const msgpack = require("@msgpack/msgpack");
    return {
      serialize: (v: unknown) => {
        const bytes = msgpack.encode(v) as Uint8Array;
        return bytesToBase64(bytes);
      },
      deserialize: (s: string) => {
        const bytes = base64ToBytes(s);
        return msgpack.decode(bytes);
      },
    };
  } catch {
    return {
      serialize: (v: unknown) => JSON.stringify(v),
      deserialize: (s: string) => JSON.parse(s) as unknown,
    };
  }
}

import type { CacheSerializer } from "../types.js";

export const jsonSerializer: CacheSerializer = {
  serialize: (v: unknown) => JSON.stringify(v),
  deserialize: (raw: string) => JSON.parse(raw) as unknown,
};

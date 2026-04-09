import type { CachePlugin, CachePluginContext, CacheSerializer } from "../types.js";

export interface EncryptPluginOptions {
  /** 32-byte encryption key */
  key: Uint8Array;
}

/**
 * Encrypts values at rest using @justwant/crypto. Requires a 32-byte key.
 */
export function encryptPlugin(options: EncryptPluginOptions): CachePlugin {
  const { key } = options;

  return {
    name: "encrypt",
    async init(context: CachePluginContext) {
      const { encrypt, decrypt } = await import("@justwant/crypto/encrypt");
      const serializer: CacheSerializer = {
        serialize: (v: unknown) => encrypt(JSON.stringify(v), key),
        deserialize: (raw: string) => {
          const dec = decrypt(raw, key);
          return dec === null ? null : (JSON.parse(dec) as unknown);
        },
      };
      context.setSerializer?.(serializer);
    },
  };
}

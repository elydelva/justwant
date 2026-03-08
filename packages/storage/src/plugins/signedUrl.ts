/**
 * Plugin signedUrl - default options for getSignedUrl.
 */

import type { GetSignedUrlParams, StorageGetSignedUrlNext, StoragePlugin } from "../types.js";

export interface SignedUrlPluginOptions {
  defaultExpiresIn?: number;
  defaultMethod?: "GET" | "PUT";
}

export function signedUrlPlugin(options?: SignedUrlPluginOptions): StoragePlugin {
  const { defaultExpiresIn = 3600, defaultMethod = "GET" } = options ?? {};

  return {
    name: "signedUrl",

    getSignedUrl(params: GetSignedUrlParams, next: StorageGetSignedUrlNext): Promise<string> {
      const merged = {
        ...params,
        options: {
          expiresIn: params.options?.expiresIn ?? defaultExpiresIn,
          method: params.options?.method ?? defaultMethod,
          ...params.options,
        },
      };
      return next(merged);
    },
  };
}

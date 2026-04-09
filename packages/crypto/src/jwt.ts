import { SignJWT, jwtVerify } from "jose";

export interface JwtEncodeOptions {
  /** Expiration in seconds from now (sets `exp` claim). */
  expIn?: number;
  /** Issued-at timestamp (default: now). */
  iat?: number;
}

function secretToKey(secret: string | Uint8Array): Uint8Array {
  return typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
}

/**
 * Encode a payload as a signed JWT (HS256) via jose. Optionally sets `exp` and `iat`.
 */
export async function encodeJwt(
  payload: Record<string, unknown>,
  secret: string | Uint8Array,
  options?: JwtEncodeOptions
): Promise<string> {
  const key = secretToKey(secret);
  let jwt = new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(options?.iat ?? Math.floor(Date.now() / 1000));
  if (options?.expIn !== undefined) {
    jwt = jwt.setExpirationTime(Math.floor(Date.now() / 1000) + options.expIn);
  }
  return jwt.sign(key);
}

/**
 * Decode and verify a JWT (HS256) via jose. Returns the payload or null if invalid/expired.
 */
export async function decodeJwt<T = Record<string, unknown>>(
  token: string,
  secret: string | Uint8Array
): Promise<T | null> {
  try {
    const key = secretToKey(secret);
    const { payload } = await jwtVerify(token, key);
    return payload as T;
  } catch {
    return null;
  }
}

export {
  encodeJwt as createJwt,
  decodeJwt as verifyJwt,
  type JwtEncodeOptions as CreateJwtOptions,
};

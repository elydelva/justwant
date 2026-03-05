import { CompactSign, compactVerify } from "jose";

function secretToKey(secret: string | Uint8Array): Uint8Array {
  return typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
}

/**
 * Sign a payload (object or string) with HS256 via jose. Returns a compact JWS
 * (header.payload.signature). Use verify() to decode.
 */
export async function sign(payload: unknown, secret: string | Uint8Array): Promise<string> {
  const payloadBytes =
    typeof payload === "string"
      ? new TextEncoder().encode(payload)
      : new TextEncoder().encode(JSON.stringify(payload));
  const key = secretToKey(secret);
  return await new CompactSign(payloadBytes).setProtectedHeader({ alg: "HS256" }).sign(key);
}

/**
 * Verify and decode a token produced by sign(). Returns the parsed payload or null if invalid.
 */
export async function verify<T = unknown>(
  token: string,
  secret: string | Uint8Array
): Promise<T | null> {
  try {
    const key = secretToKey(secret);
    const { payload } = await compactVerify(token, key);
    const raw = new TextDecoder().decode(payload);
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  } catch {
    return null;
  }
}

export { sign as signMessage, verify as verifySignedMessage };

/**
 * Constant-time comparison of two Uint8Arrays. Pure JS, no Node dependency — safe for Edge (Workers, Vercel Edge, etc.).
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Constant-time comparison of two strings (e.g. API key from header vs stored). Safe for Edge.
 */
export function secureCompareStrings(a: string, b: string): boolean {
  const enc = new TextEncoder();
  return timingSafeEqual(enc.encode(a), enc.encode(b));
}

export { timingSafeEqual as secureCompare };

const REDACTED = "[redacted]";

export function shouldRedact(key: string, redact: string[] | RegExp | undefined): boolean {
  if (!redact) return false;
  if (Array.isArray(redact)) return redact.includes(key);
  return redact.test(key);
}

export function redactValue(value: string, redact: boolean): string {
  return redact ? REDACTED : value;
}

export function redactRecord<T extends Record<string, unknown>>(
  record: T,
  redact: string[] | RegExp | undefined
): Record<string, unknown> {
  if (!redact) return record as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    result[k] = shouldRedact(k, redact) ? REDACTED : v;
  }
  return result;
}

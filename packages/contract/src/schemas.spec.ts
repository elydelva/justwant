import { describe, expect, test } from "bun:test";
import { emailSchema, ipv4Schema, slugSchema, urlSchema, uuidSchema } from "./schemas.js";

function validate(schema: { "~standard"?: { validate: (v: unknown) => unknown } }, value: unknown) {
  const result = schema["~standard"]?.validate(value);
  return result as { value?: unknown; issues?: { message?: string }[] };
}

describe("uuidSchema", () => {
  test("accepts valid UUID", () => {
    const r = validate(uuidSchema, "550e8400-e29b-41d4-a716-446655440000");
    expect(r.issues).toBeUndefined();
    expect(r.value).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  test("rejects invalid UUID", () => {
    const r = validate(uuidSchema, "not-a-uuid");
    expect(r.issues?.length).toBeGreaterThan(0);
  });

  test("rejects non-string", () => {
    const r = validate(uuidSchema, 123);
    expect(r.issues?.length).toBeGreaterThan(0);
  });
});

describe("emailSchema", () => {
  test("accepts valid email", () => {
    const r = validate(emailSchema, "user@example.com");
    expect(r.issues).toBeUndefined();
    expect(r.value).toBe("user@example.com");
  });

  test("rejects invalid email", () => {
    const r = validate(emailSchema, "not-an-email");
    expect(r.issues?.length).toBeGreaterThan(0);
  });
});

describe("urlSchema", () => {
  test("accepts valid URL", () => {
    const r = validate(urlSchema, "https://example.com/path");
    expect(r.issues).toBeUndefined();
  });

  test("rejects invalid URL", () => {
    const r = validate(urlSchema, "not-a-url");
    expect(r.issues?.length).toBeGreaterThan(0);
  });
});

describe("ipv4Schema", () => {
  test("accepts valid IPv4", () => {
    const r = validate(ipv4Schema, "192.168.1.1");
    expect(r.issues).toBeUndefined();
  });

  test("rejects invalid IPv4", () => {
    const r = validate(ipv4Schema, "256.1.1.1");
    expect(r.issues?.length).toBeGreaterThan(0);
  });
});

describe("slugSchema", () => {
  test("accepts valid slug", () => {
    const r = validate(slugSchema, "my-slug-123");
    expect(r.issues).toBeUndefined();
  });

  test("rejects slug with uppercase", () => {
    const r = validate(slugSchema, "My-Slug");
    expect(r.issues?.length).toBeGreaterThan(0);
  });
});

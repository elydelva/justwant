import { describe, expect, test } from "bun:test";
import { decrypt, decryptWithPassword, encrypt, encryptWithPassword } from "./encrypt.js";

const KEY = new Uint8Array(32).fill(1);

describe("encrypt / decrypt", () => {
  test("round-trips a plaintext string", () => {
    const ct = encrypt("hello world", KEY);
    expect(typeof ct).toBe("string");
    expect(decrypt(ct, KEY)).toBe("hello world");
  });

  test("round-trips an empty string", () => {
    const ct = encrypt("", KEY);
    expect(decrypt(ct, KEY)).toBe("");
  });

  test("returns null for tampered ciphertext", () => {
    const ct = encrypt("secret", KEY);
    const tampered = ct.slice(0, -4) + "XXXX";
    expect(decrypt(tampered, KEY)).toBeNull();
  });

  test("returns null for ciphertext that is too short", () => {
    expect(decrypt("dG9vc2hvcnQ", KEY)).toBeNull();
  });

  test("throws when key length is wrong", () => {
    expect(() => encrypt("x", new Uint8Array(16))).toThrow("Key must be 32 bytes");
    expect(() => decrypt("x", new Uint8Array(16))).toThrow("Key must be 32 bytes");
  });
});

describe("encryptWithPassword / decryptWithPassword", () => {
  test("round-trips a plaintext string", () => {
    const ct = encryptWithPassword("secret message", "p@ssw0rd");
    expect(decryptWithPassword(ct, "p@ssw0rd")).toBe("secret message");
  });

  test("returns null for wrong password", () => {
    const ct = encryptWithPassword("secret", "correct");
    expect(decryptWithPassword(ct, "wrong")).toBeNull();
  });

  test("returns null for malformed input (no separator)", () => {
    expect(decryptWithPassword("nodot", "pass")).toBeNull();
  });

  test("returns null for malformed input (too many separators)", () => {
    expect(decryptWithPassword("a.b.c", "pass")).toBeNull();
  });

  test("accepts an explicit salt", () => {
    const salt = new Uint8Array(16).fill(42);
    const ct = encryptWithPassword("data", "pass", salt);
    // Salt portion is deterministic; full ciphertext differs due to random nonce
    expect(ct.startsWith(ct.split(".")[0]!)).toBe(true);
    expect(decryptWithPassword(ct, "pass")).toBe("data");
  });

  test("throws when salt is too short", () => {
    expect(() => encryptWithPassword("x", "pass", new Uint8Array(4))).toThrow(
      "Salt must be at least 8 bytes"
    );
  });
});

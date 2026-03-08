import { describe, expect, test } from "bun:test";
import { defineValue } from "./defineValue.js";
import { defineEnvSource } from "./sources/env.js";
import { defineJsonSource } from "./sources/json.js";

describe("defineValue", () => {
  test("returns the definition as-is for key lookup", () => {
    const source = defineEnvSource({ env: { FOO: "bar" } });
    const def = defineValue({ from: source, key: "FOO" });
    expect(def).toEqual({ from: source, key: "FOO" });
  });

  test("returns the definition as-is for path lookup", () => {
    const source = defineJsonSource({ data: { a: { b: 42 } } });
    const def = defineValue({ from: source, path: "a.b" });
    expect(def).toEqual({ from: source, path: "a.b" });
  });

  test("returns the definition as-is for path with field (vault-style)", () => {
    const source = defineJsonSource({ data: {} });
    const def = defineValue({ from: source, path: "secret/data/db", field: "url" });
    expect(def).toEqual({ from: source, path: "secret/data/db", field: "url" });
  });
});

import { describe, expect, test } from "bun:test";
import { defineResource } from "./defineResource.js";

describe("defineResource", () => {
  test("produces a ResourceDef with correct name", () => {
    const booking = defineResource({ name: "booking" });
    expect(booking.name).toBe("booking");
  });

  test("creates a Resource ref with correct type and id", () => {
    const booking = defineResource({ name: "booking" });
    const ref = booking("abc123");
    expect(ref).toEqual({ type: "booking", id: "abc123" });
  });

  test("different resources produce different types", () => {
    const booking = defineResource({ name: "booking" });
    const document = defineResource({ name: "document" });
    expect(booking("x").type).toBe("booking");
    expect(document("x").type).toBe("document");
  });
});

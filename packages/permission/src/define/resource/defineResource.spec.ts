import { describe, expect, test } from "bun:test";
import { defineResource } from "./defineResource.js";

describe("defineResource", () => {
  test("returns resource with id when called with id", () => {
    const documentResource = defineResource({ name: "document" });
    const resource = documentResource("doc_1");
    expect(resource.type).toBe("document");
    expect(resource.id).toBe("doc_1");
  });

  test("throws when no id provided", () => {
    const documentResource = defineResource({ name: "document" });
    expect(() => (documentResource as () => unknown)()).toThrow(
      /resource "document" requires an id/
    );
  });

  test("exposes name on def", () => {
    const documentResource = defineResource({ name: "document" });
    expect(documentResource.name).toBe("document");
  });
});

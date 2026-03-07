import { describe, expect, test } from "bun:test";
import { createResource } from "./createResource.js";

describe("createResource", () => {
  test("returns resource with id when called with id", () => {
    const documentResource = createResource({ name: "document" });
    const resource = documentResource("doc_1");
    expect(resource.type).toBe("document");
    expect(resource.id).toBe("doc_1");
  });

  test("throws when no id provided", () => {
    const documentResource = createResource({ name: "document" });
    expect(() => (documentResource as () => unknown)()).toThrow(
      /resource "document" requires an id/
    );
  });

  test("exposes name on def", () => {
    const documentResource = createResource({ name: "document" });
    expect(documentResource.name).toBe("document");
  });
});

import { describe, expect, test } from "bun:test";
import { createResource } from "./createResource.js";

describe("createResource", () => {
  test("returns resource with id when called with single id", () => {
    const documentResource = createResource({ name: "document" });
    const resource = documentResource("doc_1");
    expect(resource.type).toBe("document");
    expect(resource.id).toBe("doc_1");
    expect(resource.orgId).toBeUndefined();
  });

  test("returns resource with orgId and id when within and two args", () => {
    const documentResource = createResource({ name: "document", within: "org" });
    const resource = documentResource("org_1", "doc_1");
    expect(resource.type).toBe("document");
    expect(resource.id).toBe("doc_1");
    expect(resource.orgId).toBe("org_1");
  });

  test("throws when no id provided", () => {
    const documentResource = createResource({ name: "document" });
    expect(() => (documentResource as () => unknown)()).toThrow(
      /resource "document" requires an id/
    );
  });

  test("exposes name and within on def", () => {
    const documentResource = createResource({ name: "document", within: "org" });
    expect(documentResource.name).toBe("document");
    expect(documentResource.within).toBe("org");
  });
});

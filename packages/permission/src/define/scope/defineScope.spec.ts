import { describe, expect, test } from "bun:test";
import { defineScope } from "./defineScope.js";

describe("defineScope", () => {
  test("scope() returns singular scope without id", () => {
    const appScope = defineScope({ name: "app" });
    const scope = appScope();
    expect(scope.type).toBe("app");
    expect(scope.id).toBeNull();
  });

  test("scope(id) returns plural scope with id", () => {
    const orgScope = defineScope({ name: "org" });
    const scope = orgScope("org_1");
    expect(scope.type).toBe("org");
    expect(scope.id).toBe("org_1");
  });

  test("scope() with any scope type returns singular (id null)", () => {
    const appScope = defineScope({ name: "app" });
    const scope = appScope();
    expect(scope.type).toBe("app");
    expect(scope.id).toBeNull();
  });

  test("exposes name on def", () => {
    const appScope = defineScope({ name: "app" });
    expect(appScope.name).toBe("app");
  });
});

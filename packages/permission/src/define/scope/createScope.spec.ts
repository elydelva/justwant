import { describe, expect, test } from "bun:test";
import { createScope } from "./createScope.js";

describe("createScope", () => {
  test("singular scope returns scope without id", () => {
    const appScope = createScope({ name: "app", singular: true });
    const scope = appScope();
    expect(scope.type).toBe("app");
    expect(scope.id).toBeNull();
  });

  test("plural scope returns scope with id", () => {
    const orgScope = createScope({ name: "org", singular: false });
    const scope = orgScope("org_1");
    expect(scope.type).toBe("org");
    expect(scope.id).toBe("org_1");
  });

  test("plural scope with within returns scope with orgId and id", () => {
    const groupScope = createScope({
      name: "group",
      singular: false,
      within: "org",
    });
    const scope = groupScope("org_1", "grp_1");
    expect(scope.type).toBe("group");
    expect(scope.id).toBe("grp_1");
    expect(scope.orgId).toBe("org_1");
  });

  test("plural scope throws when no id provided", () => {
    const orgScope = createScope({ name: "org", singular: false });
    expect(() => orgScope()).toThrow(/scope "org" requires an id/);
  });

  test("singular scope ignores args and returns scope without id", () => {
    const appScope = createScope({ name: "app", singular: true });
    const scope = appScope("ignored");
    expect(scope.type).toBe("app");
    expect(scope.id).toBeNull();
  });
});

import { describe, expect, test } from "bun:test";
import { defineFeature } from "./defineFeature.js";

describe("defineFeature", () => {
  test("produces a FeatureDef with correct name", () => {
    const blog = defineFeature({ name: "blog" });
    expect(blog.name).toBe("blog");
  });

  test("creates a Feature ref with correct type and id", () => {
    const blog = defineFeature({ name: "blog" });
    const ref = blog("feat_abc");
    expect(ref).toEqual({ type: "blog", id: "feat_abc" });
  });

  test("different features produce different types", () => {
    const blog = defineFeature({ name: "blog" });
    const calendar = defineFeature({ name: "calendar" });
    expect(blog("x").type).toBe("blog");
    expect(calendar("x").type).toBe("calendar");
  });
});

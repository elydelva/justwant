import { describe, expect, test } from "bun:test";
import { defineEmbeddable } from "./defineEmbeddable.js";
import { defineUniverse } from "./defineUniverse.js";

describe("defineUniverse", () => {
  test("returns object with id, dimension, and embeddable", () => {
    const embeddable = defineEmbeddable({
      idField: "id",
      toText: () => "",
    });
    const universe = defineUniverse({
      id: "missions",
      dimension: 768,
      embeddable,
    });
    expect(universe.id).toBe("missions");
    expect(universe.dimension).toBe(768);
    expect(universe.embeddable).toBe(embeddable);
  });

  test("embeddable is preserved as provided", () => {
    const embeddable = defineEmbeddable({
      idField: "missionId",
      toText: (m: { title: string }) => m.title,
      metadataFields: ["type"] as const,
    });
    const universe = defineUniverse({ id: "m", dimension: 1536, embeddable });
    expect(universe.embeddable.idField).toBe("missionId");
    expect(universe.embeddable.toText({ missionId: "1", title: "Test", type: "a" })).toBe("Test");
  });
});

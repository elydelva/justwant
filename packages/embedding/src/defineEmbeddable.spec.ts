import { describe, expect, test } from "bun:test";
import { defineEmbeddable } from "./defineEmbeddable.js";

describe("defineEmbeddable", () => {
  test("returns object with idField, toText, and optional metadataFields", () => {
    const toText = (item: { title: string }) => item.title;
    const embeddable = defineEmbeddable({
      idField: "missionId",
      toText,
      metadataFields: ["type", "cities"] as const,
    });
    expect(embeddable.idField).toBe("missionId");
    expect(embeddable.toText).toBe(toText);
    expect(embeddable.metadataFields).toEqual(["type", "cities"]);
  });

  test("toText is called with item and returns string", () => {
    const embeddable = defineEmbeddable({
      idField: "id",
      toText: (item: { a: string; b: string }) => `${item.a} ${item.b}`,
    });
    const result = embeddable.toText({ id: "1", a: "hello", b: "world" });
    expect(result).toBe("hello world");
  });

  test("metadataFields can be omitted", () => {
    const embeddable = defineEmbeddable({ idField: "id", toText: () => "" });
    expect(embeddable.metadataFields).toBeUndefined();
  });
});

import { describe, expect, test } from "bun:test";
import { defineReferralOffer } from "./defineReferralOffer.js";

describe("defineReferralOffer", () => {
  test("is callable — returns typed ref", () => {
    const offer = defineReferralOffer({ name: "waitlist_beta" });
    expect(offer.name).toBe("waitlist_beta");
    expect(offer("ref-123")).toEqual({ type: "waitlist_beta", id: "ref-123" });
  });

  test("key() returns name for simple offer", () => {
    const offer = defineReferralOffer({ name: "waitlist_beta" });
    expect(offer.key()).toBe("waitlist_beta");
  });

  test("key() returns offer key from params when params defined", () => {
    const offer = defineReferralOffer({ name: "waitlist", params: ["listId"] });
    expect(offer.key({ listId: "beta" })).toBe("waitlist:listId:beta");
    expect(offer.key({ listId: "prod" })).toBe("waitlist:listId:prod");
  });

  test("key() sorts param keys for deterministic offer key", () => {
    const offer = defineReferralOffer({ name: "multi", params: ["b", "a"] });
    expect(offer.key({ a: "1", b: "2" })).toBe("multi:a:1:b:2");
  });

  test("key() returns base name when no params passed", () => {
    const offer = defineReferralOffer({ name: "waitlist", params: ["listId"] });
    expect(offer.key()).toBe("waitlist");
  });

  test("attaches codeGenerator and defaultReferrerType", () => {
    const codeGen = () => "custom-code";
    const offer = defineReferralOffer({
      name: "x",
      codeGenerator: codeGen,
      defaultReferrerType: "user",
    });
    expect(offer.codeGenerator).toBe(codeGen);
    expect(offer.defaultReferrerType).toBe("user");
  });
});

import { describe, expect, test } from "bun:test";
import { defineReferralOffer } from "./defineReferralOffer.js";

describe("defineReferralOffer", () => {
  test("returns callable def with id for simple offer", () => {
    const offer = defineReferralOffer({ id: "waitlist_beta" });
    expect(offer.id).toBe("waitlist_beta");
    expect(offer()).toBe("waitlist_beta");
  });

  test("returns offer key from params when params defined", () => {
    const offer = defineReferralOffer({
      id: "waitlist",
      params: ["listId"],
    });
    expect(offer({ listId: "beta" })).toBe("waitlist:listId:beta");
    expect(offer({ listId: "prod" })).toBe("waitlist:listId:prod");
  });

  test("sorts param keys for deterministic offer key", () => {
    const offer = defineReferralOffer({
      id: "multi",
      params: ["b", "a"],
    });
    expect(offer({ a: "1", b: "2" })).toBe("multi:a:1:b:2");
  });

  test("returns base id when no params passed", () => {
    const offer = defineReferralOffer({
      id: "waitlist",
      params: ["listId"],
    });
    expect(offer()).toBe("waitlist");
  });

  test("attaches codeGenerator and defaultReferrerType", () => {
    const codeGen = () => "custom-code";
    const offer = defineReferralOffer({
      id: "x",
      codeGenerator: codeGen,
      defaultReferrerType: "user",
    });
    expect(offer.codeGenerator).toBe(codeGen);
    expect(offer.defaultReferrerType).toBe("user");
  });
});

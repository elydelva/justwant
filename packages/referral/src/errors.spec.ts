import { describe, expect, test } from "bun:test";
import { AlreadyReferredError, InvalidReferralCodeError, ReferralError } from "./errors.js";

describe("ReferralError", () => {
  test("creates error with message and code", () => {
    const err = new ReferralError("test", "CODE", { foo: "bar" });
    expect(err.message).toBe("test");
    expect(err.code).toBe("CODE");
    expect(err.metadata).toEqual({ foo: "bar" });
    expect(err.name).toBe("ReferralError");
  });
});

describe("AlreadyReferredError", () => {
  test("creates error with offerKey and recipientId", () => {
    const err = new AlreadyReferredError("waitlist_beta", "user-123");
    expect(err.message).toContain("user-123");
    expect(err.message).toContain("waitlist_beta");
    expect(err.code).toBe("ALREADY_REFERRED");
    expect(err.offerKey).toBe("waitlist_beta");
    expect(err.recipientId).toBe("user-123");
  });
});

describe("InvalidReferralCodeError", () => {
  test("creates error with offerKey and referralCode", () => {
    const err = new InvalidReferralCodeError("waitlist_beta", "bad-code");
    expect(err.message).toContain("bad-code");
    expect(err.code).toBe("INVALID_REFERRAL_CODE");
    expect(err.offerKey).toBe("waitlist_beta");
    expect(err.referralCode).toBe("bad-code");
  });
});

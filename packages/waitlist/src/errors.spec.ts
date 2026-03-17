import { describe, expect, test } from "bun:test";
import {
  AlreadySubscribedError,
  EmptyWaitlistError,
  NotSubscribedError,
  WaitlistError,
} from "./errors.js";

describe("WaitlistError", () => {
  test("creates error with message, code, metadata, name", () => {
    const err = new WaitlistError("test", "CODE", { foo: "bar" });
    expect(err.message).toBe("test");
    expect(err.code).toBe("CODE");
    expect(err.metadata).toEqual({ foo: "bar" });
    expect(err.name).toBe("WaitlistError");
  });
});

describe("AlreadySubscribedError", () => {
  test("creates error with listKey and actorKey in metadata", () => {
    const err = new AlreadySubscribedError("beta", "user:u1");
    expect(err.message).toContain("already subscribed");
    expect(err.code).toBe("ALREADY_SUBSCRIBED");
    expect(err.listKey).toBe("beta");
    expect(err.actorKey).toBe("user:u1");
    expect(err.metadata).toEqual({ listKey: "beta", actorKey: "user:u1" });
    expect(err.name).toBe("AlreadySubscribedError");
  });
});

describe("NotSubscribedError", () => {
  test("creates error with listKey and actorKey in metadata", () => {
    const err = new NotSubscribedError("beta", "user:u1");
    expect(err.message).toContain("not subscribed");
    expect(err.code).toBe("NOT_SUBSCRIBED");
    expect(err.listKey).toBe("beta");
    expect(err.actorKey).toBe("user:u1");
    expect(err.metadata).toEqual({ listKey: "beta", actorKey: "user:u1" });
    expect(err.name).toBe("NotSubscribedError");
  });
});

describe("EmptyWaitlistError", () => {
  test("creates error with listKey in metadata", () => {
    const err = new EmptyWaitlistError("beta");
    expect(err.message).toContain("empty");
    expect(err.code).toBe("EMPTY_WAITLIST");
    expect(err.listKey).toBe("beta");
    expect(err.metadata).toEqual({ listKey: "beta" });
    expect(err.name).toBe("EmptyWaitlistError");
  });
});

import { describe, expect, test } from "bun:test";
import { createContextService } from "./createContextService.js";
import { defineSlot } from "./defineSlot.js";
import { ResolutionError, SlotNotFoundError } from "./errors/index.js";

describe("createContextService", () => {
  test("forRequest returns RequestContext with initial", () => {
    const ctx = createContextService({ slots: [] });
    const requestCtx = ctx.forRequest({ userId: "u1", requestId: "r1" });
    expect(requestCtx.initial).toEqual({ userId: "u1", requestId: "r1" });
  });

  test("get resolves on-demand slot and caches result", async () => {
    let resolveCount = 0;
    const userSlot = defineSlot({
      key: "user",
      scope: "on-demand",
      resolve: async (ctx) => {
        resolveCount++;
        return { id: ctx.initial.userId };
      },
    });

    const ctx = createContextService({ slots: [userSlot] });
    const requestCtx = ctx.forRequest({ userId: "u1" });

    const user1 = await requestCtx.get(userSlot);
    const user2 = await requestCtx.get(userSlot);

    expect(user1).toEqual({ id: "u1" });
    expect(user2).toEqual({ id: "u1" });
    expect(resolveCount).toBe(1);
  });

  test("get throws SlotNotFoundError for unregistered slot", async () => {
    const userSlot = defineSlot({
      key: "user",
      scope: "on-demand",
      resolve: async () => ({ id: "u1" }),
    });
    const otherSlot = defineSlot({
      key: "other",
      scope: "on-demand",
      resolve: async () => null,
    });

    const ctx = createContextService({ slots: [userSlot] });
    const requestCtx = ctx.forRequest({});

    await expect(requestCtx.get(otherSlot)).rejects.toThrow(SlotNotFoundError);
    await expect(requestCtx.get(otherSlot)).rejects.toThrow('Slot "other" is not registered');
  });

  test("get wraps resolution failure in ResolutionError", async () => {
    const userSlot = defineSlot({
      key: "user",
      scope: "on-demand",
      resolve: async () => {
        throw new Error("DB connection failed");
      },
    });

    const ctx = createContextService({ slots: [userSlot] });
    const requestCtx = ctx.forRequest({});

    let err: unknown;
    try {
      await requestCtx.get(userSlot);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ResolutionError);
    expect((err as ResolutionError).slotKey).toBe("user");
    expect((err as ResolutionError).cause).toBeInstanceOf(Error);
    expect((err as ResolutionError).cause).toHaveProperty("message", "DB connection failed");
  });

  test("slots can depend on other slots via ctx.get", async () => {
    const userSlot = defineSlot({
      key: "user",
      scope: "on-demand",
      resolve: async (ctx) => ({ id: ctx.initial.userId, name: "Alice" }),
    });
    const orgSlot = defineSlot({
      key: "org",
      scope: "on-demand",
      resolve: async (ctx) => {
        const user = await ctx.get(userSlot);
        return { id: "o1", ownerId: user.id };
      },
    });

    const ctx = createContextService({ slots: [userSlot, orgSlot] });
    const requestCtx = ctx.forRequest({ userId: "u1" });

    const org = await requestCtx.get(orgSlot);
    expect(org).toEqual({ id: "o1", ownerId: "u1" });
  });

  test("eager slots are resolved at forRequest", async () => {
    let eagerResolved = false;
    const eagerSlot = defineSlot({
      key: "eager",
      scope: "eager",
      resolve: async () => {
        eagerResolved = true;
        return "eager-value";
      },
    });

    const ctx = createContextService({ slots: [eagerSlot] });
    ctx.forRequest({});

    await new Promise((r) => setTimeout(r, 0));
    expect(eagerResolved).toBe(true);
  });

  test("request slots are resolved at forRequest", async () => {
    let requestResolved = false;
    const requestSlot = defineSlot({
      key: "req",
      scope: "request",
      resolve: async (ctx) => {
        requestResolved = true;
        return ctx.initial.requestId;
      },
    });

    const ctx = createContextService({ slots: [requestSlot] });
    ctx.forRequest({ requestId: "r1" });

    await new Promise((r) => setTimeout(r, 0));
    expect(requestResolved).toBe(true);
  });

  test("each forRequest creates independent cache", async () => {
    let resolveCount = 0;
    const userSlot = defineSlot({
      key: "user",
      scope: "on-demand",
      resolve: async (ctx) => {
        resolveCount++;
        return ctx.initial.userId;
      },
    });

    const ctx = createContextService({ slots: [userSlot] });
    const req1 = ctx.forRequest({ userId: "u1" });
    const req2 = ctx.forRequest({ userId: "u2" });

    await req1.get(userSlot);
    await req1.get(userSlot);
    await req2.get(userSlot);

    expect(resolveCount).toBe(2);
    expect(await req1.get(userSlot)).toBe("u1");
    expect(await req2.get(userSlot)).toBe("u2");
  });
});

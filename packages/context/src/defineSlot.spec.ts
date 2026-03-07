import { describe, expect, test } from "bun:test";
import { defineSlot } from "./defineSlot.js";
import type { RequestContext } from "./types/index.js";

describe("defineSlot", () => {
  test("returns frozen SlotDef with key, scope, and resolve", () => {
    const resolve = async () => "value";
    const slot = defineSlot({
      key: "user",
      scope: "on-demand",
      resolve,
    });

    expect(slot.key).toBe("user");
    expect(slot.scope).toBe("on-demand");
    expect(slot.resolve).toBe(resolve);
    expect(Object.isFrozen(slot)).toBe(true);
  });

  test("accepts all SlotScope values", () => {
    const resolve = async () => null;
    expect(defineSlot({ key: "a", scope: "request", resolve }).scope).toBe("request");
    expect(defineSlot({ key: "b", scope: "on-demand", resolve }).scope).toBe("on-demand");
    expect(defineSlot({ key: "c", scope: "eager", resolve }).scope).toBe("eager");
  });

  test("resolve receives RequestContext with initial", async () => {
    const initial = { userId: "u1" };
    const slot = defineSlot({
      key: "user",
      scope: "on-demand",
      resolve: async (ctx) => {
        expect(ctx.initial).toEqual(initial);
        return ctx.initial.userId as string;
      },
    });

    const mockCtx = {
      initial: Object.freeze(initial),
      get: async () => "ignored",
    };
    const result = await slot.resolve(mockCtx as RequestContext);
    expect(result).toBe("u1");
  });
});

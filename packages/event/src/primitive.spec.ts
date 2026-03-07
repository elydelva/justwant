import { describe, expect, test } from "bun:test";
import { createPrimitiveEventBus } from "./primitive.js";

describe("createPrimitiveEventBus", () => {
  describe("emit and listen", () => {
    test("calls handler when exact pattern matches emitted type", () => {
      const bus = createPrimitiveEventBus();
      let received: unknown = null;
      bus.listen("user.created", (payload) => {
        received = payload;
      });
      bus.emit("user.created", { id: "u1", name: "Alice" });
      expect(received).toEqual({ id: "u1", name: "Alice" });
    });

    test("does not call handler when type does not match pattern", () => {
      const bus = createPrimitiveEventBus();
      let called = false;
      bus.listen("user.created", () => {
        called = true;
      });
      bus.emit("user.updated", { id: "u1" });
      expect(called).toBe(false);
    });

    test("calls multiple handlers for same pattern", () => {
      const bus = createPrimitiveEventBus();
      const received: unknown[] = [];
      bus.listen("order.placed", (p) => {
        received.push(p);
      });
      bus.listen("order.placed", (p) => {
        received.push(p);
      });
      bus.emit("order.placed", { orderId: "o1" });
      expect(received).toHaveLength(2);
      expect(received[0]).toEqual({ orderId: "o1" });
      expect(received[1]).toEqual({ orderId: "o1" });
    });

    test("returns early when no handlers registered for type", () => {
      const bus = createPrimitiveEventBus();
      expect(bus.emit("unknown.event", {})).toBeUndefined();
    });

    test("passes undefined when payload omitted", () => {
      const bus = createPrimitiveEventBus();
      let received: unknown = "not-set";
      bus.listen("ping", (p) => {
        received = p;
      });
      bus.emit("ping");
      expect(received).toBeUndefined();
    });
  });

  describe("wildcard patterns", () => {
    test("'*' matches any event type", () => {
      const bus = createPrimitiveEventBus();
      const received: string[] = [];
      bus.listen("*", (payload) => {
        received.push((payload as { type: string }).type ?? "unknown");
      });
      bus.emit("user.created", { type: "user.created" });
      bus.emit("order.deleted", { type: "order.deleted" });
      bus.emit("anything", { type: "anything" });
      expect(received).toEqual(["user.created", "order.deleted", "anything"]);
    });

    test("'user.*' matches user.created and user.updated but not user", () => {
      const bus = createPrimitiveEventBus();
      const received: string[] = [];
      bus.listen("user.*", (p) => {
        received.push((p as { id: string }).id);
      });
      bus.emit("user.created", { id: "created" });
      bus.emit("user.updated", { id: "updated" });
      bus.emit("user.deleted", { id: "deleted" });
      expect(received).toEqual(["created", "updated", "deleted"]);
    });

    test("'user.*' does not match bare 'user' (no suffix)", () => {
      const bus = createPrimitiveEventBus();
      let called = false;
      bus.listen("user.*", () => {
        called = true;
      });
      bus.emit("user", {});
      expect(called).toBe(false);
    });

    test("'user.*' does not match 'user.' (empty suffix)", () => {
      const bus = createPrimitiveEventBus();
      let called = false;
      bus.listen("user.*", () => {
        called = true;
      });
      bus.emit("user.", {});
      expect(called).toBe(false);
    });

    test("'order.*' matches order.placed but not orders.placed", () => {
      const bus = createPrimitiveEventBus();
      const received: string[] = [];
      bus.listen("order.*", (p) => {
        received.push((p as { id: string }).id);
      });
      bus.emit("order.placed", { id: "placed" });
      bus.emit("orders.placed", { id: "wrong" });
      expect(received).toEqual(["placed"]);
    });
  });

  describe("listen returns unsubscribe", () => {
    test("unsubscribe stops handler from being called", () => {
      const bus = createPrimitiveEventBus();
      let calls = 0;
      const unsub = bus.listen("test", () => {
        calls++;
      });
      bus.emit("test", {});
      expect(calls).toBe(1);
      unsub();
      bus.emit("test", {});
      expect(calls).toBe(1);
    });
  });

  describe("listenOnce", () => {
    test("handler is called only once then auto-unsubscribed", () => {
      const bus = createPrimitiveEventBus();
      let calls = 0;
      bus.listenOnce("once", () => {
        calls++;
      });
      bus.emit("once", {});
      bus.emit("once", {});
      expect(calls).toBe(1);
    });

    test("listenOnce returns unsubscribe that removes handler before first emit", () => {
      const bus = createPrimitiveEventBus();
      let calls = 0;
      const unsub = bus.listenOnce("once", () => {
        calls++;
      });
      unsub();
      bus.emit("once", {});
      expect(calls).toBe(0);
    });
  });

  describe("unlisten", () => {
    test("unlisten removes handler by reference", () => {
      const bus = createPrimitiveEventBus();
      let calls = 0;
      const handler = () => {
        calls++;
      };
      bus.listen("test", handler);
      bus.emit("test", {});
      expect(calls).toBe(1);
      bus.unlisten("test", handler);
      bus.emit("test", {});
      expect(calls).toBe(1);
    });
  });

  describe("async handlers", () => {
    test("emit returns Promise when any handler returns Promise", async () => {
      const bus = createPrimitiveEventBus();
      bus.listen("async", async () => {});
      const result = bus.emit("async", {});
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test("emit waits for all async handlers before resolving", async () => {
      const bus = createPrimitiveEventBus();
      const order: string[] = [];
      bus.listen("async", async () => {
        order.push("start1");
        await Promise.resolve();
        order.push("end1");
      });
      bus.listen("async", async () => {
        order.push("start2");
        await Promise.resolve();
        order.push("end2");
      });
      await bus.emit("async", {});
      expect(order).toEqual(["start1", "start2", "end1", "end2"]);
    });
  });
});

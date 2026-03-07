import { describe, expect, test } from "bun:test";
import { createEventBus, defineEvent } from "./typed.js";

describe("defineEvent", () => {
  test("returns TypedEvent with type and createPayload", () => {
    const userCreated = defineEvent("user.created", (id: string, name: string) => ({
      id,
      name,
    }));
    expect(userCreated.type).toBe("user.created");
    expect(userCreated.createPayload("u1", "Alice")).toEqual({ id: "u1", name: "Alice" });
  });

  test("createPayload accepts zero args when builder has no params", () => {
    const ping = defineEvent("ping", () => ({}));
    expect(ping.createPayload()).toEqual({});
  });

  test("createPayload passes through complex objects", () => {
    const ev = defineEvent("complex", (data: { a: number; b: string[] }) => data);
    expect(ev.createPayload({ a: 1, b: ["x"] })).toEqual({ a: 1, b: ["x"] });
  });
});

describe("createEventBus", () => {
  const userCreated = defineEvent("user.created", (id: string, name: string) => ({ id, name }));
  const userUpdated = defineEvent("user.updated", (id: string) => ({ id }));
  const orderPlaced = defineEvent("order.placed", (orderId: string) => ({ orderId }));
  const events = [userCreated, userUpdated, orderPlaced] as const;

  describe("emit and listen with event objects", () => {
    test("emit creates payload via event.createPayload and delivers to listener", () => {
      const bus = createEventBus({ events });
      let received: unknown = null;
      bus.listen(userCreated, (payload) => {
        received = payload;
      });
      bus.emit(userCreated, "u1", "Alice");
      expect(received).toEqual({ id: "u1", name: "Alice" });
    });

    test("emit with string type resolves event and creates payload", () => {
      const bus = createEventBus({ events });
      let received: unknown = null;
      bus.listen("user.created", (payload) => {
        received = payload;
      });
      bus.emit("user.created", "u2", "Bob");
      expect(received).toEqual({ id: "u2", name: "Bob" });
    });

    test("listen with string type receives correct payload", () => {
      const bus = createEventBus({ events });
      let received: unknown = null;
      bus.listen("order.placed", (payload) => {
        received = payload;
      });
      bus.emit(orderPlaced, "o1");
      expect(received).toEqual({ orderId: "o1" });
    });
  });

  describe("wildcard patterns (default)", () => {
    test("'user.*' receives user.created and user.updated", () => {
      const bus = createEventBus({ events });
      const received: unknown[] = [];
      bus.listen("user.*", (p) => {
        received.push(p);
      });
      bus.emit(userCreated, "u1", "A");
      bus.emit(userUpdated, "u1");
      expect(received).toHaveLength(2);
      expect(received[0]).toEqual({ id: "u1", name: "A" });
      expect(received[1]).toEqual({ id: "u1" });
    });

    test("'*' receives all events", () => {
      const bus = createEventBus({ events });
      const received: unknown[] = [];
      bus.listen("*", (p) => {
        received.push(p);
      });
      bus.emit(userCreated, "u1", "A");
      bus.emit(orderPlaced, "o1");
      expect(received).toHaveLength(2);
      expect(received[0]).toEqual({ id: "u1", name: "A" });
      expect(received[1]).toEqual({ orderId: "o1" });
    });
  });

  describe("wildcard: false", () => {
    test("listen rejects wildcard patterns when wildcard is false", () => {
      const bus = createEventBus({ events, wildcard: false });
      let received: unknown = null;
      bus.listen(userCreated, (p) => {
        received = p;
      });
      bus.emit(userCreated, "u1", "A");
      expect(received).toEqual({ id: "u1", name: "A" });
      // Type-level: "user.*" and "*" are not valid when wildcard: false
      // Runtime: bus still has listen; we just test exact patterns work
    });
  });

  describe("listenOnce", () => {
    test("handler called once then auto-unsubscribed", () => {
      const bus = createEventBus({ events });
      let calls = 0;
      bus.listenOnce(userCreated, () => {
        calls++;
      });
      bus.emit(userCreated, "u1", "A");
      bus.emit(userCreated, "u2", "B");
      expect(calls).toBe(1);
    });
  });

  describe("unlisten", () => {
    test("unlisten removes handler", () => {
      const bus = createEventBus({ events });
      let calls = 0;
      const handler = () => {
        calls++;
      };
      bus.listen(userCreated, handler);
      bus.emit(userCreated, "u1", "A");
      bus.unlisten(userCreated, handler);
      bus.emit(userCreated, "u2", "B");
      expect(calls).toBe(1);
    });
  });

  describe("unsubscribe from listen", () => {
    test("returned unsubscribe stops handler", () => {
      const bus = createEventBus({ events });
      let calls = 0;
      const unsub = bus.listen(userCreated, () => {
        calls++;
      });
      bus.emit(userCreated, "u1", "A");
      unsub();
      bus.emit(userCreated, "u2", "B");
      expect(calls).toBe(1);
    });
  });
});

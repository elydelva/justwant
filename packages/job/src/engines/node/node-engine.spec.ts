import { describe, expect, mock, test } from "bun:test";
import { nodeEngine } from "./index.js";

// node-cron is a real dependency — use the real module but control task execution manually
describe("nodeEngine", () => {
  test("capabilities.name is node", () => {
    const engine = nodeEngine();
    expect(engine.capabilities.name).toBe("node");
  });

  test("register without handler does not schedule", async () => {
    const engine = nodeEngine();
    // Should not throw
    await engine.register({ job: { id: "j" }, cron: "* * * * *" });
    const queues = await engine.listQueues();
    expect(queues).toHaveLength(1);
    expect(queues[0]?.id).toBe("j");
  });

  test("register with handler schedules the job", async () => {
    const engine = nodeEngine();
    const handler = { run: mock(async () => {}) };
    await engine.register({ job: { id: "j" }, cron: "* * * * *" }, handler as never);
    const queues = await engine.listQueues();
    expect(queues[0]?.status).toBe("active");
    await engine.unregister("j");
  });

  test("handle registers and schedules the job", async () => {
    const engine = nodeEngine();
    const handler = { run: mock(async () => {}) };
    await engine.handle({ job: { id: "j2" }, cron: "* * * * *" }, handler as never);
    const queues = await engine.listQueues();
    expect(queues.some((q) => q.id === "j2")).toBe(true);
    await engine.unregister("j2");
  });

  test("unregister removes the queue", async () => {
    const engine = nodeEngine();
    const handler = { run: mock(async () => {}) };
    await engine.register({ job: { id: "j" }, cron: "* * * * *" }, handler as never);
    await engine.unregister("j");
    const queues = await engine.listQueues();
    expect(queues).toHaveLength(0);
  });

  test("enqueue triggers handler immediately", async () => {
    const engine = nodeEngine();
    const handler = { run: mock(async (_p: unknown) => {}) };
    await engine.register({ job: { id: "j" }, cron: "* * * * *" }, handler as never);
    await engine.enqueue("j", { foo: "bar" });
    expect(handler.run).toHaveBeenCalledTimes(1);
    await engine.unregister("j");
  });

  test("enqueue throws when job not registered", async () => {
    const engine = nodeEngine();
    await expect(engine.enqueue("unknown")).rejects.toThrow("Job not found");
  });

  test("register without cron throws", async () => {
    const engine = nodeEngine();
    const handler = { run: mock(async () => {}) };
    await expect(
      engine.register({ job: { id: "j" } }, handler as never)
    ).rejects.toThrow("needs cron");
  });

  test("register with invalid cron throws", async () => {
    const engine = nodeEngine();
    const handler = { run: mock(async () => {}) };
    await expect(
      engine.register({ job: { id: "j" }, cron: "not-a-cron" }, handler as never)
    ).rejects.toThrow("Invalid cron");
  });

  test("stats returns run count", async () => {
    const engine = nodeEngine();
    const handler = { run: mock(async () => {}) };
    await engine.register({ job: { id: "j" }, cron: "* * * * *" }, handler as never);
    await engine.enqueue("j");
    await engine.enqueue("j");
    const s = await engine.stats("j");
    expect(s.runs).toBe(2);
    await engine.unregister("j");
  });

  test("listQueues includes cron expression", async () => {
    const engine = nodeEngine();
    await engine.register({ job: { id: "j" }, cron: "0 * * * *" });
    const queues = await engine.listQueues();
    expect(queues[0]?.cron).toBe("0 * * * *");
  });

  test("start and stop call through without error", async () => {
    const engine = nodeEngine();
    const handler = { run: mock(async () => {}) };
    await engine.register({ job: { id: "j" }, cron: "* * * * *" }, handler as never);
    await expect(engine.start()).resolves.toBeUndefined();
    await expect(engine.stop()).resolves.toBeUndefined();
    await engine.unregister("j");
  });
});

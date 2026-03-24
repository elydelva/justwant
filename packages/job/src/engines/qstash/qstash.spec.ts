import { describe, expect, mock, test } from "bun:test";
import { qstashEngine } from "./index.js";

function mockClient() {
  const createdSchedules: unknown[] = [];
  const deletedSchedules: string[] = [];
  const published: unknown[] = [];

  return {
    schedules: {
      create: mock(async (opts: unknown) => {
        createdSchedules.push(opts);
        return { scheduleId: "sched-123" };
      }),
      delete: mock(async (id: string) => {
        deletedSchedules.push(id);
      }),
    },
    publish: mock(async (opts: unknown) => {
      published.push(opts);
      return {};
    }),
    _data: { createdSchedules, deletedSchedules, published },
  };
}

describe("qstashEngine", () => {
  test("capabilities.name is qstash", () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    expect(engine.capabilities.name).toBe("qstash");
  });

  test("register creates schedule when cron is defined", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    await engine.register({
      job: { id: "my-job" },
      cron: "0 * * * *",
    });
    expect(client.schedules.create).toHaveBeenCalledTimes(1);
    const call = client.schedules.create.mock.calls[0][0] as { destination: string; cron: string };
    expect(call.destination).toBe("https://app.example.com/job/my-job");
    expect(call.cron).toBe("0 * * * *");
  });

  test("register does not create schedule when no cron", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    await engine.register({ job: { id: "my-job" } });
    expect(client.schedules.create).not.toHaveBeenCalled();
  });

  test("register uses routePrefix option", async () => {
    const client = mockClient();
    const engine = qstashEngine({
      client,
      baseUrl: "https://app.example.com",
      routePrefix: "/api/jobs",
    });
    await engine.register({ job: { id: "my-job" }, cron: "* * * * *" });
    const call = client.schedules.create.mock.calls[0][0] as { destination: string };
    expect(call.destination).toBe("https://app.example.com/api/jobs/my-job");
  });

  test("register prepends CRON_TZ when job has timezone", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    await engine.register({
      job: { id: "my-job", defaults: { timezone: "America/New_York" } },
      cron: "0 9 * * *",
    });
    const call = client.schedules.create.mock.calls[0][0] as { cron: string };
    expect(call.cron).toBe("CRON_TZ=America/New_York 0 9 * * *");
  });

  test("unregister deletes schedule and cleans up", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    await engine.register({ job: { id: "my-job" }, cron: "* * * * *" });
    await engine.unregister("my-job");
    expect(client.schedules.delete).toHaveBeenCalledWith("sched-123");
    const queues = await engine.listQueues();
    expect(queues).toHaveLength(0);
  });

  test("enqueue publishes to the correct URL", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    await engine.enqueue("send-email", { to: "user@example.com" });
    expect(client.publish).toHaveBeenCalledTimes(1);
    const call = client.publish.mock.calls[0][0] as { url: string; body: string };
    expect(call.url).toBe("https://app.example.com/job/send-email");
    expect(JSON.parse(call.body)).toEqual({ to: "user@example.com" });
  });

  test("enqueue uses empty object when no payload", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    await engine.enqueue("my-job");
    const call = client.publish.mock.calls[0][0] as { body: string };
    expect(JSON.parse(call.body)).toEqual({});
  });

  test("listQueues returns registered queues", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    await engine.register({ job: { id: "a" }, cron: "* * * * *" });
    await engine.register({ job: { id: "b" } });
    const queues = await engine.listQueues();
    expect(queues).toHaveLength(2);
    const active = queues.find((q) => q.id === "a");
    expect(active?.status).toBe("active");
    const unknown = queues.find((q) => q.id === "b");
    expect(unknown?.status).toBe("unknown");
  });

  test("stats returns zeros", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    const s = await engine.stats("any");
    expect(s.runs).toBe(0);
    expect(s.failures).toBe(0);
  });

  test("start and stop are no-ops", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" });
    await expect(engine.start()).resolves.toBeUndefined();
    await expect(engine.stop()).resolves.toBeUndefined();
  });

  test("verifySignature returns true when no signingKey", async () => {
    const client = mockClient();
    const engine = qstashEngine({ client, baseUrl: "https://app.example.com" }) as unknown as {
      verifySignature: (req: Request) => Promise<boolean>;
    };
    const req = new Request("https://app.example.com/job/x", { method: "POST", body: "{}" });
    expect(await engine.verifySignature(req)).toBe(true);
  });
});

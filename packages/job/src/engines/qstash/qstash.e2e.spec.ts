/**
 * E2E tests for QStash engine.
 * Requires: QStash dev server (npx @upstash/qstash-cli dev) on port 8080.
 */
import { describe, expect, test } from "bun:test";
import { createJob } from "../../core.js";
import { defineJob } from "../../defineJob.js";
import { defineQueue } from "../../defineQueue.js";
import { QSTASH_URL, hasQStashDev } from "../../e2e-helpers.js";
import { qstashEngine } from "./index.js";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN ?? "dummy";

async function createQStashClient() {
  const { Client } = await import("@upstash/qstash");
  return new Client({
    token: QSTASH_TOKEN,
    baseUrl: QSTASH_URL,
  });
}

describe("QStash engine E2E", () => {
  test("register creates schedule", async () => {
    if (!(await hasQStashDev())) {
      console.log(
        "Skipping QStash E2E: QStash dev server not available (run: npx @upstash/qstash-cli dev)"
      );
      return;
    }

    const client = await createQStashClient();
    const jobId = `qstash-reg-${Date.now()}`;
    const jobService = createJob({
      engine: qstashEngine({
        client,
        baseUrl: "https://example.com",
        routePrefix: "/job",
      }),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ name: jobId });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    const handler = job.handle(async () => {});

    await expect(jobService.register(queue, handler)).resolves.not.toThrow();

    await jobService.unregister(queue.job.name);
  });

  test("enqueue sends POST to destination", async () => {
    if (!(await hasQStashDev())) {
      console.log(
        "Skipping QStash E2E: QStash dev server not available (run: npx @upstash/qstash-cli dev)"
      );
      return;
    }

    let received = false;
    let receivedBody = "";
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        received = true;
        receivedBody = req.url;
        return req.text().then((body) => {
          receivedBody = body;
          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        });
      },
    });
    const baseUrl = `http://localhost:${server.port}`;

    try {
      const client = await createQStashClient();
      const jobId = `qstash-trigger-${Date.now()}`;
      const jobService = createJob({
        engine: qstashEngine({
          client,
          baseUrl,
          routePrefix: "/job",
        }),
        skipRuntimeCheck: true,
      });
      const job = defineJob({ name: jobId });
      const queue = defineQueue({ job, cron: "0 0 1 1 *" });
      const handler = job.handle(async () => {});

      await jobService.register(queue, handler);
      await jobService.enqueue(queue.job.name, { foo: "bar" });

      await new Promise((r) => setTimeout(r, 500));
      expect(received).toBe(true);
      expect(receivedBody).toContain("foo");
      expect(receivedBody).toContain("bar");
    } finally {
      server.stop();
    }
  });

  test("dispatch executes handler", async () => {
    const jobId = `qstash-dispatch-${Date.now()}`;
    const mockClient = {
      schedules: {
        create: async () => ({ scheduleId: jobId }),
        delete: async () => {},
      },
      publish: async () => {},
    };
    const jobService = createJob({
      engine: qstashEngine({
        client: mockClient,
        baseUrl: "https://example.com",
      }),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ name: jobId });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });

    await jobService.register(queue, handler);

    const req = new Request(`http://localhost/job/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
    });
    const result = await jobService.dispatch(jobId, req);

    expect(result.status).toBe(200);
    expect(ran).toBe(true);
  });
});

/**
 * E2E tests for pg engine.
 * Requires: Postgres (docker compose up -d in packages/job).
 */
import { describe, expect, test } from "bun:test";
import { createJob } from "../../core.js";
import { defineJob } from "../../defineJob.js";
import { defineQueue } from "../../defineQueue.js";
import { POSTGRES_URL, hasPostgres } from "../../e2e-helpers.js";
import { pgEngine } from "./index.js";

describe("pg engine E2E", () => {
  test("register and enqueue executes handler", async () => {
    if (!(await hasPostgres())) {
      console.log("Skipping pg E2E: Postgres not available (run: docker compose up -d)");
      return;
    }

    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: POSTGRES_URL });
    const tableName = `jobs_e2e_${Date.now()}`;

    const jobService = createJob({
      engine: pgEngine({ pool, tableName }),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: `pg-trigger-${Date.now()}` });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    let ran = false;
    const handler = job.handle(async () => {
      ran = true;
    });

    await jobService.register(queue, handler);
    await jobService.enqueue(queue.job.id, {});
    expect(ran).toBe(true);

    await jobService.unregister(queue.job.id);
    await jobService.stop();
    await pool.end();
  });

  test("listQueues returns registered queues", async () => {
    if (!(await hasPostgres())) {
      console.log("Skipping pg E2E: Postgres not available (run: docker compose up -d)");
      return;
    }

    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: POSTGRES_URL });
    const tableName = `jobs_e2e_${Date.now()}`;
    const jobId = `pg-list-${Date.now()}`;

    const jobService = createJob({
      engine: pgEngine({ pool, tableName }),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: jobId });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    const handler = job.handle(async () => {});

    await jobService.register(queue, handler);
    const list = await jobService.listQueues();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(jobId);

    await jobService.unregister(queue.job.id);
    await jobService.stop();
    await pool.end();
  });

  test("unregister removes queue", async () => {
    if (!(await hasPostgres())) {
      console.log("Skipping pg E2E: Postgres not available (run: docker compose up -d)");
      return;
    }

    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: POSTGRES_URL });
    const tableName = `jobs_e2e_${Date.now()}`;
    const jobId = `pg-unreg-${Date.now()}`;

    const jobService = createJob({
      engine: pgEngine({ pool, tableName }),
      skipRuntimeCheck: true,
    });
    const job = defineJob({ id: jobId });
    const queue = defineQueue({ job, cron: "0 0 1 1 *" });
    const handler = job.handle(async () => {});

    await jobService.register(queue, handler);
    expect(await jobService.listQueues()).toHaveLength(1);

    await jobService.unregister(queue.job.id);
    expect(await jobService.listQueues()).toHaveLength(0);

    await jobService.stop();
    await pool.end();
  });
});

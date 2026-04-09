/**
 * @justwant/job — Postgres engine
 * Polling-based scheduling. No Redis. Jobs persisted in DB.
 */

import { createRequire } from "node:module";
import { defineEngine } from "../index.js";

const require = createRequire(import.meta.url);
import type {
  JobEngineContract,
  JobHandler,
  JobStats,
  QueueDefinition,
  QueueStatus,
} from "../../types.js";

export interface PgEngineOptions {
  /** Pool or client with query(text, params?) and query(string). */
  pool: {
    query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  };
  /** Table name for jobs (default: jobs). */
  tableName?: string;
  /** Polling interval in ms (default: 60000). */
  pollIntervalMs?: number;
}

const DEFAULT_TABLE = "jobs";

function queueId(def: QueueDefinition): string {
  return def.queue ?? def.job.id;
}

export function pgEngine(options: PgEngineOptions): JobEngineContract {
  const { pool, tableName = DEFAULT_TABLE, pollIntervalMs = 60_000 } = options;
  const definitions = new Map<string, QueueDefinition>();
  const handlers = new Map<string, JobHandler>();
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  const lastRuns = new Map<string, Date>();
  const runCounts = new Map<string, number>();

  async function ensureTable(): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id TEXT PRIMARY KEY,
        cron TEXT NOT NULL,
        payload JSONB DEFAULT '{}',
        last_run_at TIMESTAMPTZ,
        next_run_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  function getNextRun(cron: string, from?: Date): Date {
    try {
      const parser = require("cron-parser") as {
        parseExpression: (
          c: string,
          o?: { currentDate?: Date }
        ) => { next: () => { toDate: () => Date } };
      };
      const expr = parser.parseExpression(cron, { currentDate: from ?? new Date() });
      return expr.next().toDate();
    } catch {
      const d = from ?? new Date();
      const next = new Date(d.getTime() + 60_000);
      next.setSeconds(0, 0);
      return next;
    }
  }

  async function pollAndExecute(): Promise<void> {
    const now = new Date();
    for (const [id, def] of definitions) {
      const handler = handlers.get(id);
      if (!handler) continue;

      const cron = def.cron;
      if (!cron) continue;

      const [row] = (await pool.query(`SELECT next_run_at FROM ${tableName} WHERE id = $1`, [id]))
        .rows as { next_run_at: Date | null }[];
      const nextRun = row?.next_run_at ? new Date(row.next_run_at) : getNextRun(cron);

      if (nextRun.getTime() <= now.getTime()) {
        try {
          const lockResult = await pool.query(
            "SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",
            [`job:${id}`]
          );
          const acquired = (lockResult.rows[0] as { acquired: boolean })?.acquired;
          if (!acquired) continue;

          const count = (runCounts.get(id) ?? 0) + 1;
          runCounts.set(id, count);
          lastRuns.set(id, new Date());
          await handler.run({});

          const next = getNextRun(cron, new Date());
          await pool.query(
            `UPDATE ${tableName} SET last_run_at = $1, next_run_at = $2 WHERE id = $3`,
            [new Date(), next, id]
          );
        } catch (err) {
          console.error(`[job] Job ${id} failed:`, err);
        } finally {
          await pool.query("SELECT pg_advisory_unlock(hashtext($1))", [`job:${id}`]);
        }
      }
    }
  }

  const capabilities: JobEngineContract["capabilities"] = {
    name: "pg",
    hasNativePersistence: true,
    requires: {
      persistentRuntime: true,
      tcpConnection: true,
      unlimitedDuration: true,
    },
    supports: {
      scheduling: true,
      manualTrigger: true,
      retry: false,
      delay: false,
      priority: false,
      concurrency: false,
      pauseQueue: false,
      resumeQueue: false,
      getQueueMetadata: false,
      listInstances: false,
      getInstance: false,
      cancelInstance: false,
      retryInstance: false,
      drain: false,
      getJobCounts: false,
    },
  };

  const engine: JobEngineContract = {
    capabilities,

    async register(queueDef: QueueDefinition, handler?: JobHandler): Promise<void> {
      await ensureTable();
      const id = queueId(queueDef);
      definitions.set(id, queueDef);
      if (handler) handlers.set(id, handler);

      const cron = queueDef.cron;
      if (!cron) return;

      const nextRun = getNextRun(cron);
      await pool.query(
        `INSERT INTO ${tableName} (id, cron, next_run_at) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET cron = $2, next_run_at = $3`,
        [id, cron, nextRun]
      );

      if (!pollTimer && handlers.size > 0) {
        pollTimer = setInterval(pollAndExecute, pollIntervalMs);
      }
    },

    async handle(queueDef: QueueDefinition, handler: JobHandler): Promise<void> {
      const id = queueId(queueDef);
      handlers.set(id, handler);
      definitions.set(id, queueDef);
      await ensureTable();

      const cron = queueDef.cron;
      if (!cron) return;

      const nextRun = getNextRun(cron);
      await pool.query(
        `INSERT INTO ${tableName} (id, cron, next_run_at) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET cron = $2, next_run_at = $3`,
        [id, cron, nextRun]
      );

      pollTimer ??= setInterval(pollAndExecute, pollIntervalMs);
    },

    async unregister(id: string): Promise<void> {
      await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
      definitions.delete(id);
      handlers.delete(id);
      lastRuns.delete(id);
      runCounts.delete(id);
      if (definitions.size === 0 && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },

    async enqueue(id: string, payload?: unknown): Promise<void> {
      const handler = handlers.get(id);
      if (!handler) throw new Error(`Job not found: ${id}`);
      const count = (runCounts.get(id) ?? 0) + 1;
      runCounts.set(id, count);
      lastRuns.set(id, new Date());
      await handler.run((payload ?? {}) as never);
    },

    async listQueues(): Promise<QueueStatus[]> {
      const result = await pool.query(`SELECT id, cron, last_run_at FROM ${tableName}`);
      const rows = (result.rows ?? []) as Array<{
        id: string;
        cron: string;
        last_run_at: Date | null;
      }>;
      return rows.map((r) => ({
        id: r.id,
        cron: r.cron,
        lastRun: r.last_run_at ? new Date(r.last_run_at) : undefined,
        status: definitions.has(r.id) ? "active" : "unknown",
      }));
    },

    async stats(id: string): Promise<JobStats> {
      return {
        runs: runCounts.get(id) ?? 0,
        failures: 0,
        lastRun: lastRuns.get(id),
      };
    },

    async start(): Promise<void> {
      if (!pollTimer && handlers.size > 0) {
        pollTimer = setInterval(pollAndExecute, pollIntervalMs);
      }
    },

    async stop(): Promise<void> {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },
  };

  return defineEngine(engine);
}

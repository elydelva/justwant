/**
 * @justwant/job — QStash engine
 * HTTP-based scheduling. Edge/serverless compatible. No persistent process.
 */

import { createRequire } from "node:module";
import type { JobEngineContract, JobStats, QueueDefinition, QueueStatus } from "../../types.js";
import { defineEngine } from "../index.js";

const require = createRequire(import.meta.url);

export interface QStashEngineOptions {
  /** QStash client (user instantiates via new Client({ token })). */
  client: {
    schedules: {
      create: (opts: {
        destination: string;
        cron: string;
        scheduleId?: string;
        body?: string;
      }) => Promise<{ scheduleId?: string }>;
      delete?: (id: string) => Promise<void>;
    };
    publish: (opts: { url: string; body?: string }) => Promise<unknown>;
  };
  /** Base URL where QStash will POST (e.g. https://myapp.com). */
  baseUrl: string;
  /** Route prefix for job endpoints (default: /job). */
  routePrefix?: string;
  /** Signing key for verification (optional, for verifySignature). */
  signingKey?: string;
  /** Next signing key for key rotation. */
  nextSigningKey?: string;
  /** Aggregate schedules: one schedule tick for multiple queues (QStash feature). */
  aggregateSchedules?: boolean;
}

function queueId(def: QueueDefinition): string {
  return def.queue ?? def.job.id;
}

function getDestination(baseUrl: string, routePrefix: string, jobId: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const prefix = routePrefix.replace(/^\//, "").replace(/\/$/, "") || "job";
  return `${base}/${prefix}/${jobId}`;
}

export function qstashEngine(options: QStashEngineOptions): JobEngineContract {
  let Receiver: new (opts: { currentSigningKey: string; nextSigningKey?: string }) => {
    verify: (opts: { body: string; signature: string; url?: string }) => Promise<boolean>;
  };

  try {
    const qstash = require("@upstash/qstash");
    Receiver = qstash.Receiver;
  } catch {
    Receiver = null as never;
  }

  const { client, baseUrl, routePrefix = "/job", signingKey, nextSigningKey } = options;
  const definitions = new Map<string, QueueDefinition>();
  const scheduleIds = new Map<string, string>();

  const capabilities: JobEngineContract["capabilities"] = {
    name: "qstash",
    hasNativePersistence: true,
    requires: {
      persistentRuntime: false,
      tcpConnection: false,
      unlimitedDuration: false,
    },
    supports: {
      scheduling: true,
      manualTrigger: true,
      retry: true,
      delay: true,
      priority: false,
      concurrency: false,
      pauseQueue: false,
      resumeQueue: false,
      getQueueMetadata: false,
      listInstances: false,
      getInstance: false,
      cancelInstance: true,
      retryInstance: false,
      drain: true,
      getJobCounts: false,
      aggregateSchedules: true,
    },
  };

  const engine: JobEngineContract = {
    capabilities,

    async register(queueDef: QueueDefinition): Promise<void> {
      const id = queueId(queueDef);
      definitions.set(id, queueDef);

      const cron = queueDef.cron;
      if (!cron) return;

      const destination = getDestination(baseUrl, routePrefix, id);
      const cronExpr = queueDef.job.defaults?.timezone
        ? `CRON_TZ=${queueDef.job.defaults.timezone} ${cron}`
        : cron;
      const result = await client.schedules.create({
        destination,
        cron: cronExpr,
        scheduleId: id,
        body: JSON.stringify({}),
      });
      scheduleIds.set(id, result?.scheduleId ?? id);
    },

    async unregister(id: string): Promise<void> {
      const scheduleId = scheduleIds.get(id);
      if (scheduleId && typeof client.schedules.delete === "function") {
        try {
          await client.schedules.delete(scheduleId);
        } catch {
          // Ignore if already deleted
        }
      }
      scheduleIds.delete(id);
      definitions.delete(id);
    },

    async enqueue(id: string, payload?: unknown): Promise<void> {
      const destination = getDestination(baseUrl, routePrefix, id);
      await client.publish({
        url: destination,
        body: JSON.stringify(payload ?? {}),
      });
    },

    async listQueues(): Promise<QueueStatus[]> {
      const result: QueueStatus[] = [];
      for (const [id, def] of definitions) {
        result.push({
          id,
          cron: def.cron,
          status: scheduleIds.has(id) ? "active" : "unknown",
        });
      }
      return result;
    },

    async stats(id: string): Promise<JobStats> {
      return { runs: 0, failures: 0 };
    },

    async start(): Promise<void> {
      // No-op for QStash
    },

    async stop(): Promise<void> {
      // No-op for QStash
    },
  };

  async function verifySignature(
    req: Request | { headers: { get: (n: string) => string | null }; text?: () => Promise<string> }
  ): Promise<boolean> {
    if (!signingKey || !Receiver) return true;
    const signature =
      req instanceof Request
        ? (req.headers.get("upstash-signature") ?? req.headers.get("Upstash-Signature"))
        : ((req as { headers: { get: (n: string) => string | null } }).headers.get(
            "upstash-signature"
          ) ??
          (req as { headers: { get: (n: string) => string | null } }).headers.get(
            "Upstash-Signature"
          ));
    if (!signature) return false;
    const body =
      req instanceof Request
        ? await req.clone().text()
        : typeof (req as { text?: () => Promise<string> }).text === "function"
          ? await (req as { text: () => Promise<string> }).text()
          : "";
    const receiver = new Receiver({ currentSigningKey: signingKey, nextSigningKey });
    return receiver.verify({ body, signature, url: baseUrl });
  }

  const engineWithVerify = {
    ...engine,
    verifySignature,
    async assertSignature(
      req:
        | Request
        | { headers: { get: (n: string) => string | null }; text?: () => Promise<string> }
    ): Promise<void> {
      const valid = await verifySignature(req);
      if (!valid) throw new Error("Invalid QStash signature");
    },
  };

  return defineEngine(engineWithVerify as JobEngineContract);
}

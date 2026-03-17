/**
 * @justwant/job — QStash handler for Cloudflare Workers
 */

import type { JobService } from "../../core.js";
import { hasVerifySignature } from "./verify.js";

export interface QStashCloudflareOptions {
  verify?: boolean;
}

/**
 * Handler for Cloudflare Workers.
 * Use in your fetch handler when path matches /job/*
 */
export function qstashCloudflareHandler(
  jobService: JobService,
  options: QStashCloudflareOptions = {}
) {
  const { verify = true } = options;

  return async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.replace(/^\/+/, "").split("/");
    const jobId = pathParts[pathParts.length - 1];
    if (!jobId) {
      return new Response(JSON.stringify({ error: "Missing jobId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (verify) {
      const engine = jobService._internal.engine;
      if (hasVerifySignature(engine)) {
        const valid = await engine.verifySignature?.(request);
        if (!valid) {
          return new Response("Unauthorized", { status: 401 });
        }
      }
    }

    const body = await request.json().catch(() => ({}));
    const result = await jobService.dispatch(jobId, request, body);

    if (result.status >= 400) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(result.body ?? { ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}

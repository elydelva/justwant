/**
 * @justwant/job — QStash middleware for Next.js App Router
 */

import type { JobService } from "../../core.js";
import { hasVerifySignature } from "./verify.js";

export interface QStashNextMiddlewareOptions {
  verify?: boolean;
}

/**
 * Middleware for Next.js App Router route handlers.
 * Use: export const POST = qstashMiddleware(jobService);
 */
export function qstashMiddleware(
  jobService: JobService,
  options: QStashNextMiddlewareOptions = {}
) {
  const { verify = true } = options;

  return async function handler(
    req: Request,
    context?: { params?: Promise<{ jobId: string }> | { jobId: string } }
  ): Promise<Response> {
    const params = context?.params != null ? await Promise.resolve(context.params) : undefined;
    const jobId =
      params && typeof params === "object" && "jobId" in params ? params.jobId : undefined;
    if (!jobId) {
      return Response.json({ error: "Missing jobId" }, { status: 400 });
    }

    if (verify) {
      const engine = jobService._internal.engine;
      if (hasVerifySignature(engine)) {
        const valid = await engine.verifySignature?.(req);
        if (!valid) {
          return new Response("Unauthorized", { status: 401 });
        }
      }
    }

    const body = (await req.json().catch(() => ({}))) as unknown;
    const result = await jobService.dispatch(jobId, req, body);

    if (result.status >= 400) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json(result.body ?? { ok: true });
  };
}

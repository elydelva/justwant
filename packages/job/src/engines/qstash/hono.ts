/**
 * @justwant/job — QStash middleware for Hono
 */

interface HonoContext {
  req: { param: (name: string) => string; raw: Request; json: () => Promise<unknown> };
  json: (body: unknown, status?: number) => Response;
}
import type { JobService } from "../../core.js";
import { hasVerifySignature } from "./verify.js";

export interface QStashHonoMiddlewareOptions {
  verify?: boolean;
}

/**
 * Middleware for Hono.
 * Use: app.post("/job/:jobId", qstashMiddleware(jobService));
 */
export function qstashMiddleware(
  jobService: JobService,
  options: QStashHonoMiddlewareOptions = {}
) {
  const { verify = true } = options;

  return async function handler(c: HonoContext): Promise<Response> {
    const jobId = c.req.param("jobId");
    if (!jobId) {
      return c.json({ error: "Missing jobId" }, 400);
    }

    if (verify) {
      const engine = jobService._internal.engine;
      if (hasVerifySignature(engine)) {
        const req = c.req.raw;
        const valid = await engine.verifySignature?.(req);
        if (!valid) {
          return c.json({ error: "Unauthorized" }, 401);
        }
      }
    }

    const body = (await c.req.json().catch(() => ({}))) as unknown;
    const result = await jobService.dispatch(jobId, c.req.raw, body);

    if (result.status >= 400) {
      return c.json({ error: result.error }, result.status as 400 | 401 | 404 | 500);
    }
    return c.json(result.body ?? { ok: true });
  };
}

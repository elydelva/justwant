/**
 * @justwant/job — QStash middleware for Express
 */

interface ExpressRequest {
  params: { jobId?: string };
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  [key: string]: unknown;
}

interface ExpressResponse {
  status(code: number): ExpressResponse;
  json(body: unknown): void;
}
import type { JobService } from "../../core.js";
import { hasVerifySignature } from "./verify.js";

export interface QStashExpressMiddlewareOptions {
  verify?: boolean;
}

/**
 * Middleware for Express.
 * Use: router.post("/job/:jobId", qstashMiddleware(jobService));
 */
export function qstashMiddleware(
  jobService: JobService,
  options: QStashExpressMiddlewareOptions = {}
) {
  const { verify = true } = options;

  return async function handler(req: ExpressRequest, res: ExpressResponse): Promise<void> {
    const jobId = req.params?.jobId;
    if (!jobId) {
      res.status(400).json({ error: "Missing jobId" });
      return;
    }

    if (verify) {
      const engine = jobService._internal.engine;
      if (hasVerifySignature(engine)) {
        const nodeReq = {
          headers: {
            get: (n: string) => (req.headers[n.toLowerCase()] as string | undefined) ?? null,
          },
          text: async () =>
            typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}),
        };
        const valid = await engine.verifySignature?.(nodeReq);
        if (!valid) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
      }
    }

    const body = req.body ?? {};
    const result = await jobService.dispatch(jobId, req, body);

    if (result.status >= 400) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.body ?? { ok: true });
  };
}

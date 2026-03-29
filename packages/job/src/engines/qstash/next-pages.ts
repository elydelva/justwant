/**
 * @justwant/job — QStash handler for Next.js Pages Router
 */

interface NextApiRequest {
  method?: string;
  query: { jobId?: string };
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  [key: string]: unknown;
}

interface NextApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): NextApiResponse;
  json(body: unknown): void;
}
import type { JobService } from "../../core.js";
import { hasVerifySignature } from "./verify.js";

export interface QStashNextPagesOptions {
  verify?: boolean;
}

/**
 * API route handler for Next.js Pages Router.
 * Use in pages/api/job/[jobId].ts:
 * export default qstashNextPagesHandler(jobService);
 */
export function qstashNextPagesHandler(
  jobService: JobService,
  options: QStashNextPagesOptions = {}
) {
  const { verify = true } = options;

  return async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const jobId = req.query?.jobId;
    if (!jobId) {
      res.status(400).json({ error: "Missing jobId" });
      return;
    }

    if (verify) {
      const engine = jobService._internal.engine;
      if (hasVerifySignature(engine)) {
        const nodeReq = {
          headers: { get: (n: string) => (req.headers[n.toLowerCase()] as string) ?? null },
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

import { HeaderAdapter } from "./header.js";

/**
 * Adapter for Express (req, res).
 */
export function ExpressAdapter(
  req: { headers: { cookie?: string } },
  res: { append: (name: string, value: string) => void }
) {
  return HeaderAdapter({
    getCookie: () => req.headers.cookie ?? "",
    appendSetCookie: (v) => res.append("Set-Cookie", v),
  });
}

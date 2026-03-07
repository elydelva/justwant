import { HeaderAdapter } from "./header.js";

/**
 * Adapter for fetch Request + Response.
 */
export function RequestResponseAdapter(request: Request, response: Response) {
  return HeaderAdapter({
    getCookie: () => request.headers.get("Cookie") ?? "",
    appendSetCookie: (v) => response.headers.append("Set-Cookie", v),
  });
}

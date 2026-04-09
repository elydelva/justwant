import { defineConfig, defineDocs } from "fumadocs-mdx/config";

export const cache = defineDocs({ dir: "content/docs/cache" });
export const flag = defineDocs({ dir: "content/docs/flag" });
export const permission = defineDocs({ dir: "content/docs/permission" });
export const lock = defineDocs({ dir: "content/docs/lock" });
export const job = defineDocs({ dir: "content/docs/job" });
export const crypto = defineDocs({ dir: "content/docs/crypto" });
export const storage = defineDocs({ dir: "content/docs/storage" });
export const notify = defineDocs({ dir: "content/docs/notify" });
export const event = defineDocs({ dir: "content/docs/event" });
export const db = defineDocs({ dir: "content/docs/db" });
export const user = defineDocs({ dir: "content/docs/user" });
export const organisation = defineDocs({ dir: "content/docs/organisation" });
export const membership = defineDocs({ dir: "content/docs/membership" });
export const waitlist = defineDocs({ dir: "content/docs/waitlist" });
export const referral = defineDocs({ dir: "content/docs/referral" });
export const env = defineDocs({ dir: "content/docs/env" });
export const id = defineDocs({ dir: "content/docs/id" });

export default defineConfig({
  mdxOptions: {
    remarkNpmOptions: {
      persist: { id: "package-manager" },
    },
  },
});

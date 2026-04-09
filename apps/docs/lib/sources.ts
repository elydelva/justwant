import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import {
  crypto,
  cache,
  db,
  env,
  event,
  flag,
  id,
  job,
  lock,
  membership,
  notify,
  organisation,
  permission,
  referral,
  storage,
  user,
  waitlist,
} from "../.source/server";
import type { PackageKey } from "./packages";
export type { PackageKey } from "./packages";
export { PACKAGES, isValidPackage } from "./packages";

const plugins = [lucideIconsPlugin()];

export const sources = {
  cache: loader({ baseUrl: "/docs/cache", source: cache.toFumadocsSource(), plugins }),
  flag: loader({ baseUrl: "/docs/flag", source: flag.toFumadocsSource(), plugins }),
  permission: loader({
    baseUrl: "/docs/permission",
    source: permission.toFumadocsSource(),
    plugins,
  }),
  lock: loader({ baseUrl: "/docs/lock", source: lock.toFumadocsSource(), plugins }),
  job: loader({ baseUrl: "/docs/job", source: job.toFumadocsSource(), plugins }),
  crypto: loader({ baseUrl: "/docs/crypto", source: crypto.toFumadocsSource(), plugins }),
  storage: loader({ baseUrl: "/docs/storage", source: storage.toFumadocsSource(), plugins }),
  notify: loader({ baseUrl: "/docs/notify", source: notify.toFumadocsSource(), plugins }),
  event: loader({ baseUrl: "/docs/event", source: event.toFumadocsSource(), plugins }),
  db: loader({ baseUrl: "/docs/db", source: db.toFumadocsSource(), plugins }),
  user: loader({ baseUrl: "/docs/user", source: user.toFumadocsSource(), plugins }),
  organisation: loader({
    baseUrl: "/docs/organisation",
    source: organisation.toFumadocsSource(),
    plugins,
  }),
  membership: loader({
    baseUrl: "/docs/membership",
    source: membership.toFumadocsSource(),
    plugins,
  }),
  waitlist: loader({ baseUrl: "/docs/waitlist", source: waitlist.toFumadocsSource(), plugins }),
  referral: loader({ baseUrl: "/docs/referral", source: referral.toFumadocsSource(), plugins }),
  env: loader({ baseUrl: "/docs/env", source: env.toFumadocsSource(), plugins }),
  id: loader({ baseUrl: "/docs/id", source: id.toFumadocsSource(), plugins }),
} as const satisfies Record<PackageKey, ReturnType<typeof loader>>;

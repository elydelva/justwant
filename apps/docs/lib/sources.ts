import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import {
  crypto,
  actor,
  bezier,
  cache,
  config,
  context,
  contract,
  cookie,
  db,
  embedding,
  env,
  event,
  feature,
  flag,
  id,
  job,
  lock,
  membership,
  meta,
  notify,
  organisation,
  permission,
  preference,
  referral,
  storage,
  user,
  waitlist,
  warehouse,
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
  meta: loader({ baseUrl: "/docs/meta", source: meta.toFumadocsSource(), plugins }),
  actor: loader({ baseUrl: "/docs/actor", source: actor.toFumadocsSource(), plugins }),
  feature: loader({ baseUrl: "/docs/feature", source: feature.toFumadocsSource(), plugins }),
  bezier: loader({ baseUrl: "/docs/bezier", source: bezier.toFumadocsSource(), plugins }),
  context: loader({ baseUrl: "/docs/context", source: context.toFumadocsSource(), plugins }),
  config: loader({ baseUrl: "/docs/config", source: config.toFumadocsSource(), plugins }),
  cookie: loader({ baseUrl: "/docs/cookie", source: cookie.toFumadocsSource(), plugins }),
  contract: loader({ baseUrl: "/docs/contract", source: contract.toFumadocsSource(), plugins }),
  preference: loader({
    baseUrl: "/docs/preference",
    source: preference.toFumadocsSource(),
    plugins,
  }),
  embedding: loader({ baseUrl: "/docs/embedding", source: embedding.toFumadocsSource(), plugins }),
  warehouse: loader({ baseUrl: "/docs/warehouse", source: warehouse.toFumadocsSource(), plugins }),
} as const satisfies Record<PackageKey, ReturnType<typeof loader>>;

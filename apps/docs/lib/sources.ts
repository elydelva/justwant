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
} as const;

export type PackageKey = keyof typeof sources;

export const PACKAGES: { key: PackageKey; label: string; description: string }[] = [
  {
    key: "cache",
    label: "@justwant/cache",
    description: "Key-value cache with adapters and plugins",
  },
  {
    key: "flag",
    label: "@justwant/flag",
    description: "Feature flags with typed rules and rollout",
  },
  {
    key: "permission",
    label: "@justwant/permission",
    description: "RBAC/ABAC with scopes, roles, realms",
  },
  { key: "lock", label: "@justwant/lock", description: "Distributed locks and semaphores" },
  { key: "job", label: "@justwant/job", description: "Job queues and cron scheduling" },
  { key: "crypto", label: "@justwant/crypto", description: "Passwords, tokens, JWT, encryption" },
  { key: "storage", label: "@justwant/storage", description: "File storage abstraction" },
  { key: "notify", label: "@justwant/notify", description: "Multi-channel notifications" },
  { key: "event", label: "@justwant/event", description: "Typed event bus" },
  { key: "db", label: "@justwant/db", description: "ORM-agnostic data access layer" },
  { key: "user", label: "@justwant/user", description: "User identity and service" },
  {
    key: "organisation",
    label: "@justwant/organisation",
    description: "Organisation entity and facade",
  },
  { key: "membership", label: "@justwant/membership", description: "Member–group liaisons" },
  {
    key: "waitlist",
    label: "@justwant/waitlist",
    description: "Waitlist with positions and invitations",
  },
  { key: "referral", label: "@justwant/referral", description: "Referral codes and stats" },
  { key: "env", label: "@justwant/env", description: "Typed, validated environment variables" },
  { key: "id", label: "@justwant/id", description: "Sortable and short ID generation" },
];

export function isValidPackage(pkg: string): pkg is PackageKey {
  return pkg in sources;
}

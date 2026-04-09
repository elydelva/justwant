export type PackageKey =
  | "cache"
  | "flag"
  | "permission"
  | "lock"
  | "job"
  | "crypto"
  | "storage"
  | "notify"
  | "event"
  | "db"
  | "user"
  | "organisation"
  | "membership"
  | "waitlist"
  | "referral"
  | "env"
  | "id";

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
  return PACKAGES.some((p) => p.key === pkg);
}

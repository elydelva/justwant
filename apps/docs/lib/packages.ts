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

export type PackageCategory =
  | "Foundation"
  | "Data"
  | "Auth & Access"
  | "Product"
  | "Infrastructure";

export const PACKAGES: {
  key: PackageKey;
  label: string;
  description: string;
  category: PackageCategory;
}[] = [
  {
    key: "id",
    label: "@justwant/id",
    description: "Sortable and short ID generation",
    category: "Foundation",
  },
  {
    key: "env",
    label: "@justwant/env",
    description: "Typed, validated environment variables",
    category: "Foundation",
  },
  {
    key: "crypto",
    label: "@justwant/crypto",
    description: "Passwords, tokens, JWT, encryption",
    category: "Foundation",
  },
  {
    key: "db",
    label: "@justwant/db",
    description: "ORM-agnostic data access layer",
    category: "Data",
  },
  {
    key: "cache",
    label: "@justwant/cache",
    description: "Key-value cache with adapters and plugins",
    category: "Data",
  },
  {
    key: "storage",
    label: "@justwant/storage",
    description: "File storage abstraction",
    category: "Data",
  },
  {
    key: "user",
    label: "@justwant/user",
    description: "User identity and service",
    category: "Auth & Access",
  },
  {
    key: "permission",
    label: "@justwant/permission",
    description: "RBAC/ABAC with scopes, roles, realms",
    category: "Auth & Access",
  },
  {
    key: "organisation",
    label: "@justwant/organisation",
    description: "Organisation entity and facade",
    category: "Auth & Access",
  },
  {
    key: "membership",
    label: "@justwant/membership",
    description: "Member–group liaisons",
    category: "Auth & Access",
  },
  {
    key: "flag",
    label: "@justwant/flag",
    description: "Feature flags with typed rules and rollout",
    category: "Product",
  },
  {
    key: "waitlist",
    label: "@justwant/waitlist",
    description: "Waitlist with positions and invitations",
    category: "Product",
  },
  {
    key: "referral",
    label: "@justwant/referral",
    description: "Referral codes and stats",
    category: "Product",
  },
  {
    key: "job",
    label: "@justwant/job",
    description: "Job queues and cron scheduling",
    category: "Infrastructure",
  },
  {
    key: "event",
    label: "@justwant/event",
    description: "Typed event bus",
    category: "Infrastructure",
  },
  {
    key: "lock",
    label: "@justwant/lock",
    description: "Distributed locks and semaphores",
    category: "Infrastructure",
  },
  {
    key: "notify",
    label: "@justwant/notify",
    description: "Multi-channel notifications",
    category: "Infrastructure",
  },
];

export function isValidPackage(pkg: string): pkg is PackageKey {
  return PACKAGES.some((p) => p.key === pkg);
}

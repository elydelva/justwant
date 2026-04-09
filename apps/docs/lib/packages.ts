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
  | "id"
  | "meta"
  | "actor"
  | "feature"
  | "bezier"
  | "context"
  | "config"
  | "cookie"
  | "contract"
  | "preference"
  | "embedding"
  | "warehouse";

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
    key: "meta",
    label: "@justwant/meta",
    description: "Foundation interfaces — Inspectable, Definable, RefLike",
    category: "Foundation",
  },
  {
    key: "id",
    label: "@justwant/id",
    description: "Sortable and short ID generation",
    category: "Foundation",
  },
  {
    key: "actor",
    label: "@justwant/actor",
    description: "Canonical actor identity with scoping and serialization",
    category: "Foundation",
  },
  {
    key: "feature",
    label: "@justwant/feature",
    description: "Lightweight feature identity primitive",
    category: "Foundation",
  },
  {
    key: "bezier",
    label: "@justwant/bezier",
    description: "Cubic Bézier curves for easing and rollout diffusion",
    category: "Foundation",
  },
  {
    key: "context",
    label: "@justwant/context",
    description: "Explicit request context propagation with typed slots",
    category: "Foundation",
  },
  {
    key: "config",
    label: "@justwant/config",
    description: "Multi-source config service with waterfall resolution",
    category: "Foundation",
  },
  {
    key: "cookie",
    label: "@justwant/cookie",
    description: "Typed cookies with schema validation and framework adapters",
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
    key: "contract",
    label: "@justwant/contract",
    description: "Table contracts with typed fields and column mapping",
    category: "Data",
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
    key: "embedding",
    label: "@justwant/embedding",
    description: "Vector embeddings and similarity search with engine/storage abstraction",
    category: "Data",
  },
  {
    key: "warehouse",
    label: "@justwant/warehouse",
    description: "OLAP data access layer for ClickHouse and DuckDB",
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
    key: "preference",
    label: "@justwant/preference",
    description: "Typed user preferences with schema validation",
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

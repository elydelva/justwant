#!/usr/bin/env bun
/**
 * Registers GitHub Actions as a Trusted Publisher on npmjs.com for every
 * non-private @justwant package in this monorepo.
 *
 * Usage:
 *   NPM_TOKEN=<your-token> bun scripts/add-trusted-publisher.ts
 *   NPM_TOKEN=<your-token> NPM_OTP=<123456> bun scripts/add-trusted-publisher.ts  # if 2FA enabled
 *
 * The token must have "Read and Write" access on the target packages.
 * Generate one at: https://www.npmjs.com/settings/<user>/tokens
 *
 * npm Trusted Publishers API:
 *   POST https://registry.npmjs.org/-/package/<name>/trust
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const NPM_REGISTRY = "https://registry.npmjs.org";
const REPO_OWNER = "elydelva";
const REPO_NAME = "justwant";
const WORKFLOW_FILENAME = "publish.yml";
// Required if your npm account has 2FA enabled
const NPM_OTP = process.env.NPM_OTP;

const NPM_TOKEN = process.env.NPM_TOKEN;
if (!NPM_TOKEN) {
  console.error("Error: NPM_TOKEN environment variable is required.");
  process.exit(1);
}

// ── Collect all publishable packages ────────────────────────────────────────

const packagesDir = join(import.meta.dir, "../packages");
const entries = await readdir(packagesDir, { withFileTypes: true });

const packages: string[] = [];
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const pkgPath = join(packagesDir, entry.name, "package.json");
  try {
    const raw = await readFile(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    if (!pkg.private && pkg.name) {
      packages.push(pkg.name);
    }
  } catch {
    // no package.json — skip
  }
}

console.log(`Found ${packages.length} publishable packages:\n`);
for (const p of packages) console.log(`  ${p}`);
console.log();

// ── Register trusted publisher for each package ──────────────────────────────

const publisher = [
  {
    type: "github",
    claims: {
      repository: `${REPO_OWNER}/${REPO_NAME}`,
      workflow_ref: { file: WORKFLOW_FILENAME },
    },
  },
];

let succeeded = 0;
let failed = 0;

for (const name of packages) {
  const encoded = encodeURIComponent(name);
  const url = `${NPM_REGISTRY}/-/package/${encoded}/trust`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${NPM_TOKEN}`,
    "Content-Type": "application/json",
  };
  if (NPM_OTP) headers["npm-otp"] = NPM_OTP;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(publisher),
  });

  if (res.ok) {
    console.log(`✓ ${name}`);
    succeeded++;
  } else {
    const body = await res.text().catch(() => res.statusText);
    const detail = body ? (JSON.parse(body)?.message ?? body) : res.statusText;
    console.error(`✗ ${name} — ${res.status} ${detail}`);
    failed++;
  }
}

console.log(`\n${succeeded} succeeded, ${failed} failed.`);
if (failed > 0) process.exit(1);

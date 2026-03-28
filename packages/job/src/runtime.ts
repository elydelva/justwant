/**
 * @justwant/job — Runtime detection and engine compatibility
 */

import { EngineIncompatibleError } from "./errors.js";
import type { JobEngineContract } from "./types.js";

export type RuntimeEnv =
  | "node"
  | "vercel"
  | "vercel-edge"
  | "cloudflare"
  | "aws-lambda"
  | "unknown";

/** Detect the current runtime environment. */
export function detectRuntime(): RuntimeEnv {
  if (typeof process === "undefined") {
    return "unknown";
  }

  // Vercel Edge
  if (process.env.VERCEL && process.env.__NEXT_RUNTIME === "edge") {
    return "vercel-edge";
  }

  // Vercel Serverless (Node)
  if (process.env.VERCEL) {
    return "vercel";
  }

  // Cloudflare Workers / Pages
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_WORKERS) {
    return "cloudflare";
  }

  // AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return "aws-lambda";
  }

  // globalThis.EdgeRuntime (Vercel Edge, some edge runtimes)
  if (typeof globalThis !== "undefined" && "EdgeRuntime" in globalThis) {
    return "vercel-edge";
  }

  return "node";
}

/** Check if runtime is serverless/edge (no persistent process). */
export function isEphemeralRuntime(runtime: RuntimeEnv): boolean {
  return ["vercel", "vercel-edge", "cloudflare", "aws-lambda"].includes(runtime);
}

/**
 * Check engine compatibility with current runtime.
 * Throws EngineIncompatibleError if engine requires persistent runtime but we're in ephemeral env.
 */
export function checkEngineCompatibility(engine: JobEngineContract, runtime?: RuntimeEnv): void {
  const env = runtime ?? detectRuntime();
  const caps = engine.capabilities;

  if (caps.requires.persistentRuntime && isEphemeralRuntime(env)) {
    throw new EngineIncompatibleError(
      `Engine "${caps.name}" requires a persistent runtime. Current environment (${env}) does not support long-running processes. Consider using qstashEngine for serverless/edge.`,
      caps.name,
      env
    );
  }
}

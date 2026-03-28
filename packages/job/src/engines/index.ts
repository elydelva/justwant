/**
 * @justwant/job — Engine utilities
 */

import type { JobEngineContract } from "../types.js";

export type { JobEngineContract };
export type { EngineCapabilities } from "../types.js";

/**
 * Helper to create an engine with explicit capabilities.
 * Ensures the engine implements the contract.
 */
export function defineEngine(engine: JobEngineContract): JobEngineContract {
  return engine;
}

/**
 * @justwant/job — Engine utilities
 */

import type { EngineCapabilities, JobEngineContract } from "../types.js";

export type { JobEngineContract, EngineCapabilities };

/**
 * Helper to create an engine with explicit capabilities.
 * Ensures the engine implements the contract.
 */
export function defineEngine(engine: JobEngineContract): JobEngineContract {
  return engine;
}

/**
 * @justwant/flag — rollout
 * input ∈ [0,1], threshold ∈ [0,1]. Returns input < threshold.
 */

/**
 * Deterministic rollout: returns true if input is below threshold.
 * @param input - Normalized value in [0,1] (e.g. hash(userId))
 * @param threshold - Percentage in [0,1] (e.g. 0.3 = 30%)
 */
export function rollout(input: number, threshold: number): boolean {
  return input < threshold;
}

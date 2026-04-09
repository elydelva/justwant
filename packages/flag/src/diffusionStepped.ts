/**
 * @justwant/flag — diffusionStepped
 * Time-based diffusion with discrete steps. Interpolates between steps.
 */

export interface DiffusionSteppedOptions {
  steps: number[];
  start: Date;
  end: Date;
  at?: Date;
}

/**
 * Compute diffusion percentage at a given time using stepped interpolation.
 * progress = (at - start) / (end - start)
 * Interpolates between steps to return percentage [0,1]
 */
export function diffusionStepped(options: DiffusionSteppedOptions): number {
  const { steps, start, end, at = new Date() } = options;
  const startMs = start.getTime();
  const endMs = end.getTime();
  const atMs = at.getTime();
  const duration = endMs - startMs;
  if (duration <= 0 || steps.length === 0) return 0;
  const rawProgress = (atMs - startMs) / duration;
  if (rawProgress < 0) return 0;
  if (rawProgress >= 1) return steps.at(-1) ?? 0;
  const progress = rawProgress;
  const n = steps.length - 1;
  const segment = progress * n;
  const idx = Math.floor(segment);
  if (idx >= n) return steps[n] ?? 0;
  const t = segment - idx;
  const a = steps[idx] ?? 0;
  const b = steps[idx + 1] ?? 0;
  return a + t * (b - a);
}

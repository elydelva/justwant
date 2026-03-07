import type { CachePlugin, CachePluginContext, CacheStats } from "../types.js";

const DEFAULT_STATS: CacheStats = {
  hits: 0,
  misses: 0,
  hitRate: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  latency: {
    get: { p50: 0, p95: 0, p99: 0 },
    set: { p50: 0, p95: 0, p99: 0 },
  },
};

export function statsPlugin(): CachePlugin {
  let hits = 0;
  let misses = 0;
  let sets = 0;
  let deletes = 0;
  let errors = 0;
  const getLatencies: number[] = [];
  const setLatencies: number[] = [];

  return {
    name: "stats",
    init(context: CachePluginContext) {
      context.setStats?.(() => {
        const total = hits + misses;
        return {
          ...DEFAULT_STATS,
          hits,
          misses,
          hitRate: total > 0 ? hits / total : 0,
          sets,
          deletes,
          errors,
          latency: {
            get: percentile(getLatencies, [50, 95, 99]),
            set: percentile(setLatencies, [50, 95, 99]),
          },
        };
      });
    },
    async get(key, next) {
      const start = performance.now();
      try {
        const v = await next(key);
        getLatencies.push(performance.now() - start);
        if (v !== null) hits++;
        else misses++;
        return v;
      } catch (e) {
        errors++;
        throw e;
      }
    },
    async set(key, value, opts, next) {
      const start = performance.now();
      try {
        await next(key, value, opts);
        setLatencies.push(performance.now() - start);
        sets++;
      } catch (e) {
        errors++;
        throw e;
      }
    },
    async delete(key, next) {
      try {
        await next(key);
        deletes++;
      } catch (e) {
        errors++;
        throw e;
      }
    },
  };
}

function percentile(arr: number[], p: number[]): { p50: number; p95: number; p99: number } {
  if (arr.length === 0) return { p50: 0, p95: 0, p99: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p: number) => Math.min(Math.ceil((p / 100) * sorted.length) - 1, sorted.length - 1);
  return {
    p50: sorted[idx(50)] ?? 0,
    p95: sorted[idx(95)] ?? 0,
    p99: sorted[idx(99)] ?? 0,
  };
}

import { describe, expect, test } from "bun:test";
import { EngineIncompatibleError } from "./errors.js";
import { checkEngineCompatibility, detectRuntime, isEphemeralRuntime } from "./runtime.js";
import type { JobEngineContract } from "./types.js";

function createPersistentEngine(): JobEngineContract {
  return {
    capabilities: {
      name: "bullmq",
      hasNativePersistence: true,
      requires: { persistentRuntime: true },
      supports: {
        scheduling: true,
        manualTrigger: true,
        retry: false,
        pauseQueue: false,
        resumeQueue: false,
        getQueueMetadata: false,
        listInstances: false,
        getInstance: false,
        cancelInstance: false,
        retryInstance: false,
        drain: false,
        getJobCounts: false,
      },
    },
    register: async () => {},
    unregister: async () => {},
    enqueue: async () => {},
    listQueues: async () => [],
    stats: async () => ({ runs: 0, failures: 0 }),
    start: async () => {},
    stop: async () => {},
  };
}

function createEphemeralEngine(): JobEngineContract {
  return {
    capabilities: {
      name: "qstash",
      hasNativePersistence: true,
      requires: { persistentRuntime: false },
      supports: {
        scheduling: true,
        manualTrigger: true,
        retry: false,
        pauseQueue: false,
        resumeQueue: false,
        getQueueMetadata: false,
        listInstances: false,
        getInstance: false,
        cancelInstance: false,
        retryInstance: false,
        drain: false,
        getJobCounts: false,
      },
    },
    register: async () => {},
    unregister: async () => {},
    enqueue: async () => {},
    listQueues: async () => [],
    stats: async () => ({ runs: 0, failures: 0 }),
    start: async () => {},
    stop: async () => {},
  };
}

describe("runtime", () => {
  test("detectRuntime returns node by default", () => {
    const r = detectRuntime();
    expect(["node", "unknown"]).toContain(r);
  });

  test("isEphemeralRuntime returns false for node", () => {
    expect(isEphemeralRuntime("node")).toBe(false);
  });

  test("isEphemeralRuntime returns true for vercel", () => {
    expect(isEphemeralRuntime("vercel")).toBe(true);
    expect(isEphemeralRuntime("vercel-edge")).toBe(true);
    expect(isEphemeralRuntime("cloudflare")).toBe(true);
    expect(isEphemeralRuntime("aws-lambda")).toBe(true);
  });
});

describe("checkEngineCompatibility", () => {
  test("throws EngineIncompatibleError when engine requires persistentRuntime and runtime is vercel", () => {
    const engine = createPersistentEngine();
    expect(() => checkEngineCompatibility(engine, "vercel")).toThrow(EngineIncompatibleError);
    expect(() => checkEngineCompatibility(engine, "vercel")).toThrow("bullmq");
    expect(() => checkEngineCompatibility(engine, "vercel")).toThrow("vercel");
  });

  test("throws for vercel-edge, cloudflare, aws-lambda", () => {
    const engine = createPersistentEngine();
    expect(() => checkEngineCompatibility(engine, "vercel-edge")).toThrow(EngineIncompatibleError);
    expect(() => checkEngineCompatibility(engine, "cloudflare")).toThrow(EngineIncompatibleError);
    expect(() => checkEngineCompatibility(engine, "aws-lambda")).toThrow(EngineIncompatibleError);
  });

  test("does not throw when runtime is node", () => {
    const engine = createPersistentEngine();
    expect(() => checkEngineCompatibility(engine, "node")).not.toThrow();
  });

  test("does not throw when engine has persistentRuntime false", () => {
    const engine = createEphemeralEngine();
    expect(() => checkEngineCompatibility(engine, "vercel")).not.toThrow();
  });
});

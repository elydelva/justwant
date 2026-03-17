import { describe, expect, test } from "bun:test";
import {
  EngineIncompatibleError,
  JobError,
  JobNotFoundError,
  JobValidationError,
  UnsupportedCapabilityError,
} from "./errors.js";

describe("JobError", () => {
  test("creates error with message and code", () => {
    const err = new JobError("test", "CODE", { foo: "bar" });
    expect(err.message).toBe("test");
    expect(err.code).toBe("CODE");
    expect(err.metadata).toEqual({ foo: "bar" });
    expect(err.name).toBe("JobError");
  });

  test("uses default code JOB_ERROR when not provided", () => {
    const err = new JobError("test");
    expect(err.code).toBe("JOB_ERROR");
  });
});

describe("EngineIncompatibleError", () => {
  test("extends JobError with engineName and runtime", () => {
    const err = new EngineIncompatibleError("incompatible", "bullmq", "vercel");
    expect(err).toBeInstanceOf(JobError);
    expect(err.message).toBe("incompatible");
    expect(err.code).toBe("ENGINE_INCOMPATIBLE");
    expect(err.engineName).toBe("bullmq");
    expect(err.runtime).toBe("vercel");
    expect(err.name).toBe("EngineIncompatibleError");
  });
});

describe("JobNotFoundError", () => {
  test("creates error with jobId", () => {
    const err = new JobNotFoundError("daily-invoice");
    expect(err).toBeInstanceOf(JobError);
    expect(err.message).toBe("Job not found: daily-invoice");
    expect(err.code).toBe("JOB_NOT_FOUND");
    expect(err.jobId).toBe("daily-invoice");
    expect(err.metadata?.jobId).toBe("daily-invoice");
    expect(err.name).toBe("JobNotFoundError");
  });
});

describe("JobValidationError", () => {
  test("creates error with jobId and issues", () => {
    const issues = [{ path: "count", message: "Expected number" }];
    const err = new JobValidationError("validation failed", "test-job", issues);
    expect(err).toBeInstanceOf(JobError);
    expect(err.message).toBe("validation failed");
    expect(err.code).toBe("JOB_VALIDATION_ERROR");
    expect(err.jobId).toBe("test-job");
    expect(err.issues).toEqual(issues);
    expect(err.name).toBe("JobValidationError");
  });
});

describe("UnsupportedCapabilityError", () => {
  test("creates error with engineName and operation", () => {
    const err = new UnsupportedCapabilityError("pg", "pauseQueue");
    expect(err).toBeInstanceOf(JobError);
    expect(err.message).toContain("pg");
    expect(err.message).toContain("pauseQueue");
    expect(err.code).toBe("UNSUPPORTED_CAPABILITY");
    expect(err.engineName).toBe("pg");
    expect(err.operation).toBe("pauseQueue");
    expect(err.name).toBe("UnsupportedCapabilityError");
  });

  test("accepts custom message", () => {
    const err = new UnsupportedCapabilityError("node", "getJobCounts", "Custom message");
    expect(err.message).toBe("Custom message");
  });
});

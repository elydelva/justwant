import { describe, expect, test } from "bun:test";
import { defineCron } from "./defineCron.js";
import { defineJob } from "./defineJob.js";

describe("defineCron", () => {
  test("creates cron with job and cron expression", () => {
    const job = defineJob({ id: "daily-report" });
    const cron = defineCron({ job, cron: "0 9 * * *" });
    expect(cron.job).toBe(job);
    expect(cron.cron).toBe("0 9 * * *");
    expect(cron.id).toBeUndefined();
  });

  test("creates cron with custom id for multiple crons per job", () => {
    const job = defineJob({ id: "daily-report" });
    const cron9 = defineCron({ job, cron: "0 9 * * *", id: "daily-9am" });
    const cron18 = defineCron({ job, cron: "0 18 * * *", id: "daily-6pm" });
    expect(cron9.id).toBe("daily-9am");
    expect(cron18.id).toBe("daily-6pm");
    expect(cron9.job).toBe(cron18.job);
  });
});

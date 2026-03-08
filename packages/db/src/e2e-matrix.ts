/**
 * Shared E2E matrix: run the same scenarios across multiple dialect setups.
 * Use with describe() and test() from bun:test.
 */
import type { describe, test } from "bun:test";
import { expect } from "bun:test";

export interface E2EAdapterContext {
  dialect: "sqlite" | "pg" | "mysql";
  create: (data: { id: string; email: string; name?: string }) => Promise<{
    id: string;
    email: string;
    name?: string;
  }>;
  findById: (id: string) => Promise<{ id: string; email: string; name?: string } | null>;
  update: (
    id: string,
    data: { name?: string }
  ) => Promise<{ id: string; email: string; name?: string }>;
  findMany: (where: { email?: string }) => Promise<{ id: string; email: string; name?: string }[]>;
  hardDelete: (id: string) => Promise<void>;
  transaction?: (fn: (tx: E2EAdapterContext) => Promise<void>) => Promise<void>;
  teardown?: () => Promise<void>;
}

export type E2EScenario = (ctx: E2EAdapterContext) => Promise<void>;

export interface E2ESetup {
  name: string;
  /** Return false to skip this setup (e.g. Docker not running). */
  available: () => Promise<boolean>;
  /** Create context. Table must exist. */
  create: () => Promise<E2EAdapterContext>;
}

/**
 * Registers describe blocks and tests for each setup × scenario.
 * Call from a spec file: runE2EMatrix(setups, scenarios, { describe, test });
 */
export function runE2EMatrix(
  setups: E2ESetup[],
  scenarios: Array<{ name: string; fn: E2EScenario }>,
  runner: { describe: typeof describe; test: typeof test }
): void {
  const { describe, test } = runner;

  for (const setup of setups) {
    describe(setup.name, () => {
      for (const scenario of scenarios) {
        test(scenario.name, async () => {
          if (!(await setup.available())) {
            console.log(`Skipping E2E ${setup.name}: not available`);
            return;
          }
          const ctx = await setup.create();
          try {
            await scenario.fn(ctx);
          } finally {
            await ctx.teardown?.();
          }
        });
      }
    });
  }
}

/** Standard CRUD scenario. */
export const scenarioCrud: E2EScenario = async (ctx) => {
  const id = `e2e-${Date.now()}`;
  const created = await ctx.create({ id, email: `${id}@test.com`, name: "E2E User" });
  expect(created).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

  const found = await ctx.findById(id);
  expect(found).toMatchObject({ id, email: `${id}@test.com`, name: "E2E User" });

  const updated = await ctx.update(id, { name: "E2E Updated" });
  expect(updated.name).toBe("E2E Updated");

  const rows = await ctx.findMany({ email: `${id}@test.com` });
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ id, name: "E2E Updated" });

  await ctx.hardDelete(id);
  const afterDelete = await ctx.findById(id);
  expect(afterDelete).toBeNull();
};

/** Transaction scenario. Requires ctx.transaction. */
export const scenarioTransaction: E2EScenario = async (ctx) => {
  if (!ctx.transaction) {
    console.log("Skipping transaction: not supported");
    return;
  }
  const id = `e2e-tx-${Date.now()}`;
  await ctx.transaction(async (tx) => {
    await tx.create({ id, email: `${id}@test.com`, name: "TX User" });
  });

  const found = await ctx.findById(id);
  expect(found).not.toBeNull();
  expect(found?.email).toBe(`${id}@test.com`);
  await ctx.hardDelete(id);
};

/** Unique constraint violation. */
export const scenarioUniqueViolation: E2EScenario = async (ctx) => {
  const ts = Date.now();
  const id1 = `e2e-dup-${ts}`;
  const id2 = `e2e-dup2-${ts}`;
  const email = `dup-${ts}@test.com`;
  await ctx.create({ id: id1, email, name: "A" });

  const { AdapterUniqueViolationError } = await import("@justwant/db/errors");
  try {
    await ctx.create({ id: id2, email, name: "B" });
    throw new Error("Expected AdapterUniqueViolationError to be thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(AdapterUniqueViolationError);
  }

  await ctx.hardDelete(id1);
};

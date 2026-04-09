import { describe, expect, test } from "bun:test";
import { defineFeature } from "@justwant/feature";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { createFlagService } from "./createFlagService.js";
import { createMemoryFlagConfigRepo } from "./createMemoryFlagConfigRepo.js";
import { defineFlag } from "./defineFlag.js";
import { defineRule } from "./defineRule.js";
import { FlagValidationError } from "./errors.js";
import type { RuleDef } from "./types.js";

const strictPctSchema: StandardSchemaV1<unknown, { pct?: number }> = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (val: unknown) => {
      const obj = val as Record<string, unknown>;
      const pct = obj?.pct;
      if (pct !== undefined && (typeof pct !== "number" || pct < 0 || pct > 1)) {
        return { issues: [{ message: "pct must be number in [0,1]" }] };
      }
      return { value: val as { pct?: number } };
    },
  },
};

describe("createFlagService", () => {
  const newDashboardFeature = defineFeature({ name: "new-dashboard" });

  const betaRule = defineRule({
    id: "beta-rollout",
    config: strictPctSchema,
    defaultConfig: { pct: 0.2 },
    logic: ({ config, context }) => {
      const hash = ((context as { userId: string }).userId.charCodeAt(0) % 100) / 100;
      return hash < (config.pct ?? 0);
    },
  });

  const newDashboard = defineFlag(newDashboardFeature, {
    default: false,
    rules: [betaRule as RuleDef<unknown, unknown>],
    strategy: "any",
  });

  test("evaluate uses config from repo", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await service.setConfigOverride(betaRule, { pct: 1 });
    const result = await service.evaluate(newDashboard, { userId: "a" });
    expect(result).toBe(true);
  });

  test("evaluate configOverride overrides remote", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await service.setConfigOverride(betaRule, { pct: 0 });
    const result = await service.evaluate(
      newDashboard,
      { userId: "a" },
      {
        "beta-rollout": { pct: 1 },
      }
    );
    expect(result).toBe(true);
  });

  test("evaluate throws FlagValidationError when configOverride produces invalid merged config", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await expect(
      service.evaluate(
        newDashboard,
        { userId: "a" },
        {
          "beta-rollout": { pct: 999 },
        }
      )
    ).rejects.toThrow(FlagValidationError);
  });

  test("evaluate strategy any: at least one rule true", async () => {
    const feature = defineFeature({ name: "any-flag" });
    const ruleT = defineRule({ id: "t", logic: () => true });
    const ruleF = defineRule({ id: "f", logic: () => false });
    const flag = defineFlag(feature, { rules: [ruleT, ruleF], strategy: "any" });
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [flag], repo });
    expect(await service.evaluate(flag, {})).toBe(true);
  });

  test("evaluate strategy all: all rules must be true", async () => {
    const feature = defineFeature({ name: "all-flag" });
    const ruleT = defineRule({ id: "t", logic: () => true });
    const ruleF = defineRule({ id: "f", logic: () => false });
    const flag = defineFlag(feature, { rules: [ruleT, ruleF], strategy: "all" });
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [flag], repo });
    expect(await service.evaluate(flag, {})).toBe(false);
  });

  test("evaluate empty rules returns default", async () => {
    const feature = defineFeature({ name: "empty-flag" });
    const flag = defineFlag(feature, { rules: [], default: true });
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [flag], repo });
    expect(await service.evaluate(flag, {})).toBe(true);
  });

  test("getLatest returns last active override", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await service.setConfigOverride(betaRule, { pct: 0.5 });
    const latest = await service.getLatest(betaRule);
    expect(latest).not.toBeNull();
    expect(latest?.config).toEqual({ pct: 0.5 });
    expect(latest?.rolledBack).toBe(false);
  });

  test("getLatest accepts ruleId string", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await service.setConfigOverride(betaRule, { pct: 0.3 });
    const latest = await service.getLatest("beta-rollout");
    expect(latest?.config).toEqual({ pct: 0.3 });
  });

  test("listConfigHistory returns overrides including rolledBack", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await service.setConfigOverride(betaRule, { pct: 0.3 });
    await service.setConfigOverride(betaRule, { pct: 0.5 });
    await service.rollbackLastConfig(betaRule);
    const history = await service.listConfigHistory(betaRule);
    expect(history).toHaveLength(2);
    const [first, second] = history;
    expect(first?.rolledBack).toBe(true);
    expect(second?.rolledBack).toBe(false);
  });

  test("setConfigOverride creates override", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    const created = await service.setConfigOverride(betaRule, { pct: 0.4 });
    expect(created.ruleId).toBe("beta-rollout");
    expect(created.config).toEqual({ pct: 0.4 });
    expect(created.rolledBack).toBe(false);
  });

  test("setConfigOverride validates config and throws on invalid", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await expect(service.setConfigOverride(betaRule, { pct: 999 })).rejects.toThrow(
      FlagValidationError
    );
  });

  test("getLatest rolls back when remote config fails async validation", async () => {
    const asyncSchema: StandardSchemaV1<unknown, { pct?: number }> = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: () => Promise.resolve({ value: {} }),
      },
    };
    const rule = defineRule({
      id: "async-rule",
      config: asyncSchema,
      defaultConfig: { pct: 0.5 },
      logic: ({ config }) => (config.pct ?? 0) > 0.3,
    });
    const feature = defineFeature({ name: "async-flag" });
    const flag = defineFlag(feature, { rules: [rule as RuleDef<unknown, unknown>] });
    const repo = createMemoryFlagConfigRepo();
    await repo.create({ ruleId: "async-rule", config: { pct: 0.8 }, rolledBack: false });
    const service = createFlagService({ flags: [flag], repo });
    const latest = await service.getLatest(rule);
    expect(latest).toBeNull();
    const overrides = await repo.findMany({ ruleId: "async-rule" }, { limit: 5 });
    expect(overrides[0]?.rolledBack).toBe(true);
  });

  test("rollbackLastConfig marks latest as rolledBack", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await service.setConfigOverride(betaRule, { pct: 0.5 });
    await service.rollbackLastConfig(betaRule);
    const latest = await service.getLatest(betaRule);
    expect(latest).toBeNull();
  });

  test("rollbackLastConfig no-op when no override", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await service.rollbackLastConfig(betaRule);
    const latest = await service.getLatest(betaRule);
    expect(latest).toBeNull();
  });

  test("config corrompu: rollback + refetch", async () => {
    const repo = createMemoryFlagConfigRepo();
    const service = createFlagService({ flags: [newDashboard], repo });
    await service.setConfigOverride(betaRule, { pct: 0.2 });
    const badId = (
      await repo.create({
        ruleId: "beta-rollout",
        config: { pct: 999 },
        rolledBack: false,
      })
    ).id;
    const latest = await service.getLatest(betaRule);
    expect(latest).not.toBeNull();
    expect(latest?.id).not.toBe(badId);
    expect(latest?.config).toEqual({ pct: 0.2 });
    const badOverride = await repo.findOne({ id: badId });
    expect(badOverride?.rolledBack).toBe(true);
  });
});

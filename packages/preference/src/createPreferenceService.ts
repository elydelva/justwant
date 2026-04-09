/**
 * @justwant/preference — createPreferenceService
 * Core API: list, get, set, setMany, reset.
 */

import { toRepo } from "@justwant/actor";
import { PreferenceValidationError } from "./errors.js";
import type { Actor, PreferenceDef, PreferenceEntry, PreferenceRepository } from "./types.js";

function validateValue(
  schema: { "~standard"?: { validate: (v: unknown) => unknown } },
  value: unknown,
  key: string
): { valid: boolean; value?: unknown; issues?: { message?: string }[] } {
  const std = schema["~standard"];
  if (!std?.validate) return { valid: true, value };
  const result = std.validate(value);
  if (result && typeof (result as Promise<unknown>).then === "function") {
    return { valid: false, issues: [{ message: "Async validation not supported" }] };
  }
  const r = result as { value?: unknown; issues?: readonly { message?: string }[] };
  if (r.issues?.length) {
    return { valid: false, issues: r.issues as { message?: string }[] };
  }
  return { valid: true, value: r.value };
}

export interface CreatePreferenceServiceOptions {
  preferences: PreferenceDef[];
  repo: PreferenceRepository;
}

/** Entry for setMany: preference definition + value. */
export type PreferenceSetEntry = {
  pref: PreferenceDef;
  value: unknown;
};

export interface PreferenceService {
  /** Returns Record<pref.name, value> — all preferences with stored or default value. */
  list(actor: Actor): Promise<Record<string, unknown>>;
  get<T>(actor: Actor, pref: PreferenceDef<string, T>): Promise<T | undefined>;
  set<T>(actor: Actor, pref: PreferenceDef<string, T>, value: T): Promise<PreferenceEntry>;
  setMany(actor: Actor, entries: PreferenceSetEntry[]): Promise<void>;
  reset(actor: Actor, pref: PreferenceDef): Promise<void>;
}

export function createPreferenceService(
  options: CreatePreferenceServiceOptions
): PreferenceService {
  const { preferences, repo } = options;
  const prefMap = new Map<string, PreferenceDef>(preferences.map((p) => [p.key, p]));

  const service: PreferenceService = {
    async list(actor: Actor): Promise<Record<string, unknown>> {
      const shape = toRepo(actor);
      const actorOrgId = shape.actorOrgId ?? null;
      const where: Partial<PreferenceEntry> = {
        actorType: shape.actorType,
        actorId: shape.actorId,
        actorOrgId: actorOrgId as string | undefined,
      };

      const stored = await repo.findMany(where);
      const storedByKey = new Map(stored.map((e) => [e.preferenceKey, e]));

      const result: Record<string, unknown> = {};
      for (const pref of preferences) {
        const entry = storedByKey.get(pref.key);
        result[pref.name] = entry?.value ?? pref.default;
      }
      return result;
    },

    async get<T>(actor: Actor, pref: PreferenceDef<T>): Promise<T | undefined> {
      const registered = prefMap.get(pref.key);
      if (!registered) {
        throw new Error(`Unknown preference: ${pref.key}`);
      }
      const shape = toRepo(actor);
      const actorOrgId = shape.actorOrgId ?? null;
      const where: Partial<PreferenceEntry> = {
        preferenceKey: pref.key,
        actorType: shape.actorType,
        actorId: shape.actorId,
        actorOrgId: actorOrgId as string | undefined,
      };

      const entry = await repo.findOne(where);
      return (entry?.value ?? pref.default) as T | undefined;
    },

    async set<T>(actor: Actor, pref: PreferenceDef<T>, value: T): Promise<PreferenceEntry> {
      const registered = prefMap.get(pref.key);
      if (!registered) {
        throw new Error(`Unknown preference: ${pref.key}`);
      }
      if (pref.schema) {
        const { valid, issues } = validateValue(
          pref.schema as { "~standard"?: { validate: (v: unknown) => unknown } },
          value,
          pref.key
        );
        if (!valid) {
          throw new PreferenceValidationError(
            `Validation failed for ${pref.key}: ${(issues ?? []).map((i) => i.message).join(", ")}`,
            { key: pref.key, issues }
          );
        }
      }

      const shape = toRepo(actor);
      const actorOrgId = shape.actorOrgId ?? null;
      const where: Partial<PreferenceEntry> = {
        preferenceKey: pref.key,
        actorType: shape.actorType,
        actorId: shape.actorId,
        actorOrgId: actorOrgId as string | undefined,
      };

      const existing = await repo.findOne(where);
      const now = new Date();
      if (existing) {
        return repo.update(existing.id, { value, updatedAt: now });
      }
      return repo.create({
        preferenceKey: pref.key,
        actorType: shape.actorType,
        actorId: shape.actorId,
        actorOrgId: shape.actorOrgId,
        value,
        createdAt: now,
        updatedAt: now,
      });
    },

    async setMany(actor: Actor, entries: PreferenceSetEntry[]): Promise<void> {
      for (const { pref, value } of entries) {
        await service.set(actor, pref, value as never);
      }
    },

    async reset(actor: Actor, pref: PreferenceDef): Promise<void> {
      const registered = prefMap.get(pref.key);
      if (!registered) {
        throw new Error(`Unknown preference: ${pref.key}`);
      }
      const shape = toRepo(actor);
      const actorOrgId = shape.actorOrgId ?? null;
      const where: Partial<PreferenceEntry> = {
        preferenceKey: pref.key,
        actorType: shape.actorType,
        actorId: shape.actorId,
        actorOrgId: actorOrgId as string | undefined,
      };

      const existing = await repo.findOne(where);
      if (existing) {
        await repo.delete(existing.id);
      }
    },
  };
  return service;
}

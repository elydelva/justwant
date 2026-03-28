/**
 * @justwant/preference — SQLite PreferenceRepository for E2E tests.
 * Uses bun:sqlite (built-in). Not exported from package.
 */

import type { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import type {
  CreateInput,
  FindManyOptions,
  PreferenceEntry,
  PreferenceRepository,
} from "../types.js";

const TABLE = "preferences_e2e";

export const CREATE_TABLE_SQL = `
  CREATE TABLE ${TABLE} (
    id TEXT PRIMARY KEY,
    preference_key TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_org_id TEXT,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

function rowToEntry(row: Record<string, unknown>): PreferenceEntry {
  return {
    id: row.id as string,
    preferenceKey: row.preference_key as string,
    actorType: row.actor_type as string,
    actorId: row.actor_id as string,
    actorOrgId: row.actor_org_id ? (row.actor_org_id as string) : undefined,
    value: row.value == null ? null : JSON.parse(row.value as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function buildWhere(where: Partial<PreferenceEntry>): {
  clause: string;
  params: (string | number | null)[];
} {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (where.id != null) {
    conditions.push("id = ?");
    params.push(where.id);
  }
  if (where.preferenceKey != null) {
    conditions.push("preference_key = ?");
    params.push(where.preferenceKey);
  }
  if (where.actorType != null) {
    conditions.push("actor_type = ?");
    params.push(where.actorType);
  }
  if (where.actorId != null) {
    conditions.push("actor_id = ?");
    params.push(where.actorId);
  }
  if ("actorOrgId" in where) {
    if (where.actorOrgId === null || where.actorOrgId === undefined) {
      conditions.push("(actor_org_id IS NULL OR actor_org_id = '')");
    } else {
      conditions.push("actor_org_id = ?");
      params.push(where.actorOrgId);
    }
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { clause, params };
}

const colMap: Record<string, string> = {
  id: "id",
  preferenceKey: "preference_key",
  actorType: "actor_type",
  actorId: "actor_id",
  actorOrgId: "actor_org_id",
  value: "value",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

export function createSqlitePreferenceRepository(db: Database): PreferenceRepository {
  return {
    async create(data: CreateInput<PreferenceEntry>): Promise<PreferenceEntry> {
      const id = data.id ?? randomUUID();
      const now = new Date();
      const createdAt = data.createdAt ?? now;
      const updatedAt = data.updatedAt ?? now;

      const entry: PreferenceEntry = {
        id,
        preferenceKey: data.preferenceKey,
        actorType: data.actorType,
        actorId: data.actorId,
        actorOrgId: data.actorOrgId,
        value: data.value,
        createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
        updatedAt: updatedAt instanceof Date ? updatedAt : new Date(updatedAt),
      };

      db.run(
        `INSERT INTO ${TABLE} (id, preference_key, actor_type, actor_id, actor_org_id, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.preferenceKey,
          entry.actorType,
          entry.actorId,
          entry.actorOrgId ?? null,
          JSON.stringify(entry.value),
          entry.createdAt.toISOString(),
          entry.updatedAt.toISOString(),
        ]
      );

      return entry;
    },

    async findOne(where: Partial<PreferenceEntry>): Promise<PreferenceEntry | null> {
      const { clause, params } = buildWhere(where);
      const sql = clause
        ? `SELECT * FROM ${TABLE} ${clause} LIMIT 1`
        : `SELECT * FROM ${TABLE} LIMIT 1`;
      const row = db.query(sql).get(...params) as Record<string, unknown> | null;
      return row ? rowToEntry(row) : null;
    },

    async findMany(
      where: Partial<PreferenceEntry>,
      opts?: FindManyOptions
    ): Promise<PreferenceEntry[]> {
      const { clause, params } = buildWhere(where);
      const baseSql = clause ? `SELECT * FROM ${TABLE} ${clause}` : `SELECT * FROM ${TABLE}`;
      const orderBy = opts?.orderBy
        ? ` ORDER BY ${colMap[opts.orderBy.field] ?? opts.orderBy.field} ${opts.orderBy.direction.toUpperCase()}`
        : "";
      const limit = opts?.limit == null ? "" : ` LIMIT ${opts.limit}`;
      const offset = opts?.offset == null ? "" : ` OFFSET ${opts.offset}`;
      const sql = `${baseSql}${orderBy}${limit}${offset}`;
      const rows = db.query(sql).all(...params) as Record<string, unknown>[];
      return rows.map(rowToEntry);
    },

    async update(id: string, data: Partial<PreferenceEntry>): Promise<PreferenceEntry> {
      const existing = db.query(`SELECT * FROM ${TABLE} WHERE id = ?`).get(id) as Record<
        string,
        unknown
      > | null;
      if (!existing) throw new Error(`Not found: ${id}`);

      const updatedAt = data.updatedAt ?? new Date();
      const value =
        data.value === undefined ? (existing.value as string) : JSON.stringify(data.value);

      db.run(`UPDATE ${TABLE} SET value = ?, updated_at = ? WHERE id = ?`, [
        value,
        updatedAt.toISOString(),
        id,
      ]);

      const row = db.query(`SELECT * FROM ${TABLE} WHERE id = ?`).get(id) as Record<
        string,
        unknown
      > | null;
      if (!row) throw new Error(`Not found after update: ${id}`);
      return rowToEntry(row);
    },

    async delete(id: string): Promise<void> {
      db.run(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    },
  };
}

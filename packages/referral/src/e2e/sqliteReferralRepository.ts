/**
 * @justwant/referral — SQLite ReferralRepository for E2E tests.
 * Uses bun:sqlite (built-in). Not exported from package.
 */

import type { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import type { Referral, ReferralRepository } from "../types.js";

const TABLE = "referrals";

export const CREATE_TABLE_SQL = `
  CREATE TABLE ${TABLE} (
    id TEXT PRIMARY KEY,
    offerKey TEXT NOT NULL,
    referrerType TEXT NOT NULL,
    referrerId TEXT NOT NULL,
    recipientType TEXT NOT NULL,
    recipientId TEXT NOT NULL,
    referralCode TEXT,
    metadata TEXT,
    createdAt TEXT NOT NULL
  )
`;

function rowToReferral(row: Record<string, unknown>): Referral {
  return {
    id: row.id as string,
    offerKey: row.offerKey as string,
    referrerType: row.referrerType as string,
    referrerId: row.referrerId as string,
    recipientType: row.recipientType as string,
    recipientId: row.recipientId as string,
    referralCode: (row.referralCode as string) || undefined,
    metadata: row.metadata
      ? (JSON.parse(row.metadata as string) as Record<string, unknown>)
      : undefined,
    createdAt: new Date(row.createdAt as string),
  };
}

export function createSqliteReferralRepository(db: Database): ReferralRepository {
  return {
    async create(data): Promise<Referral> {
      const id = data.id ?? randomUUID();
      const createdAt = data.createdAt ?? new Date();
      const referral: Referral = {
        id,
        offerKey: data.offerKey,
        referrerType: data.referrerType,
        referrerId: data.referrerId,
        recipientType: data.recipientType,
        recipientId: data.recipientId,
        referralCode: data.referralCode,
        metadata: data.metadata,
        createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
      };

      const insertParams: (string | null)[] = [
        referral.id,
        referral.offerKey,
        referral.referrerType,
        referral.referrerId,
        referral.recipientType,
        referral.recipientId,
        referral.referralCode ?? null,
        referral.metadata ? JSON.stringify(referral.metadata) : null,
        referral.createdAt.toISOString(),
      ];
      db.run(
        `INSERT INTO ${TABLE} (id, offerKey, referrerType, referrerId, recipientType, recipientId, referralCode, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        insertParams
      );

      return referral;
    },

    async findOne(where): Promise<Referral | null> {
      const conditions: string[] = [];
      const params: (string | number | null)[] = [];

      if (where.id != null) {
        conditions.push("id = ?");
        params.push(where.id);
      }
      if (where.offerKey != null) {
        conditions.push("offerKey = ?");
        params.push(where.offerKey);
      }
      if (where.referrerType != null) {
        conditions.push("referrerType = ?");
        params.push(where.referrerType);
      }
      if (where.referrerId != null) {
        conditions.push("referrerId = ?");
        params.push(where.referrerId);
      }
      if (where.recipientType != null) {
        conditions.push("recipientType = ?");
        params.push(where.recipientType);
      }
      if (where.recipientId != null) {
        conditions.push("recipientId = ?");
        params.push(where.recipientId);
      }
      if (where.referralCode != null) {
        conditions.push("referralCode = ?");
        params.push(where.referralCode);
      }

      const clause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const row = db.query(`SELECT * FROM ${TABLE} ${clause} LIMIT 1`).get(...params) as Record<
        string,
        unknown
      > | null;
      return row ? rowToReferral(row) : null;
    },

    async findMany(where, opts = {}): Promise<Referral[]> {
      const conditions: string[] = [];
      const params: (string | number | null)[] = [];

      if (where.id != null) {
        conditions.push("id = ?");
        params.push(where.id);
      }
      if (where.offerKey != null) {
        conditions.push("offerKey = ?");
        params.push(where.offerKey);
      }
      if (where.referrerType != null) {
        conditions.push("referrerType = ?");
        params.push(where.referrerType);
      }
      if (where.referrerId != null) {
        conditions.push("referrerId = ?");
        params.push(where.referrerId);
      }
      if (where.recipientType != null) {
        conditions.push("recipientType = ?");
        params.push(where.recipientType);
      }
      if (where.recipientId != null) {
        conditions.push("recipientId = ?");
        params.push(where.recipientId);
      }
      if (where.referralCode != null) {
        conditions.push("referralCode = ?");
        params.push(where.referralCode);
      }

      const clause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const { limit = 50, offset = 0, orderBy } = opts;
      const orderClause = orderBy
        ? `ORDER BY ${orderBy.field} ${orderBy.direction.toUpperCase()}`
        : "ORDER BY createdAt DESC";
      const allParams: (string | number | null)[] = [...params, limit, offset];
      const rows = db
        .query(`SELECT * FROM ${TABLE} ${clause} ${orderClause} LIMIT ? OFFSET ?`)
        .all(...allParams) as Record<string, unknown>[];
      return rows.map(rowToReferral);
    },

    async count(where): Promise<number> {
      const conditions: string[] = [];
      const params: (string | number | null)[] = [];

      if (where.id != null) {
        conditions.push("id = ?");
        params.push(where.id);
      }
      if (where.offerKey != null) {
        conditions.push("offerKey = ?");
        params.push(where.offerKey);
      }
      if (where.referrerType != null) {
        conditions.push("referrerType = ?");
        params.push(where.referrerType);
      }
      if (where.referrerId != null) {
        conditions.push("referrerId = ?");
        params.push(where.referrerId);
      }
      if (where.recipientType != null) {
        conditions.push("recipientType = ?");
        params.push(where.recipientType);
      }
      if (where.recipientId != null) {
        conditions.push("recipientId = ?");
        params.push(where.recipientId);
      }
      if (where.referralCode != null) {
        conditions.push("referralCode = ?");
        params.push(where.referralCode);
      }

      const clause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const row = db.query(`SELECT COUNT(*) as c FROM ${TABLE} ${clause}`).get(...params) as {
        c: number;
      };
      return row?.c ?? 0;
    },
  };
}

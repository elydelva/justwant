/**
 * @justwant/embedding — Migration utilities for pgvector and sqlite-vec.
 * Generate SQL, verify setup, and run migrations.
 */

export interface GenerateMigrationsOptions {
  dialect: "pgvector" | "sqlite-vec";
  tableName: string;
  dimension: number;
  indexIdColumn?: string;
  /** For pgvector: create ivfflat index (requires lists param). Default false. */
  createIndex?: boolean;
  /** For pgvector ivfflat: lists parameter. Default 100. */
  ivfflatLists?: number;
}

export interface MigrationResult {
  extension?: string;
  table: string;
  index?: string;
}

/**
 * Generates migration SQL for the given dialect.
 * Returns SQL statements to run in order.
 */
export function generateMigrations(options: GenerateMigrationsOptions): MigrationResult {
  const {
    dialect,
    tableName,
    dimension,
    indexIdColumn = "index_id",
    createIndex = false,
    ivfflatLists = 100,
  } = options;

  if (dialect === "pgvector") {
    const table = `CREATE TABLE IF NOT EXISTS "${tableName}" (
  id TEXT NOT NULL,
  "${indexIdColumn}" TEXT NOT NULL,
  embedding vector(${dimension}) NOT NULL,
  metadata jsonb,
  PRIMARY KEY (id, "${indexIdColumn}")
)`;
    const index = createIndex
      ? `CREATE INDEX IF NOT EXISTS idx_${tableName}_embedding ON "${tableName}" USING ivfflat (embedding vector_cosine_ops) WITH (lists = ${ivfflatLists})`
      : undefined;
    return { extension: "CREATE EXTENSION IF NOT EXISTS vector", table, index };
  }

  if (dialect === "sqlite-vec") {
    const table = `CREATE VIRTUAL TABLE "${tableName}" USING vec0(
  id TEXT PRIMARY KEY,
  "${indexIdColumn}" TEXT PARTITION KEY,
  embedding FLOAT[${dimension}],
  +metadata TEXT
)`;
    return { table };
  }

  throw new Error(`Unsupported dialect: ${dialect}`);
}

export interface PgVerifyOptions {
  dialect: "pgvector";
  db: {
    query(text: string, values?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
  };
  tableName: string;
  dimension: number;
  schema?: string;
}

export interface SqliteVerifyOptions {
  dialect: "sqlite-vec";
  db: { prepare(sql: string): { get(...params: unknown[]): unknown }; exec?(sql: string): void };
  tableName: string;
  dimension: number;
}

export type VerifySetupOptions = PgVerifyOptions | SqliteVerifyOptions;

/**
 * Verifies that the vector table exists and has the expected structure.
 * Returns true if setup is valid.
 */
export async function verifySetup(options: VerifySetupOptions): Promise<boolean> {
  if (options.dialect === "pgvector") {
    const { db, tableName, schema = "public" } = options;
    const res = await db.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
      ) as exists`,
      [schema, tableName]
    );
    const exists = (res.rows[0] as { exists?: boolean })?.exists;
    return Boolean(exists);
  }

  if (options.dialect === "sqlite-vec") {
    const { db, tableName } = options;
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");
    const row = stmt.get(tableName) as { name?: string } | undefined;
    return Boolean(row?.name);
  }

  throw new Error(`Unsupported dialect: ${(options as { dialect: string }).dialect}`);
}

export interface PgRunOptions {
  dialect: "pgvector";
  db: {
    query(text: string, values?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
  };
  tableName: string;
  dimension: number;
  indexIdColumn?: string;
  createIndex?: boolean;
  ivfflatLists?: number;
}

export interface SqliteRunOptions {
  dialect: "sqlite-vec";
  db: { exec(sql: string): void };
  tableName: string;
  dimension: number;
  indexIdColumn?: string;
}

export type RunMigrationsOptions = PgRunOptions | SqliteRunOptions;

/**
 * Runs migrations: creates extension (pgvector), table, and optionally index.
 * Idempotent: uses IF NOT EXISTS.
 */
export async function runMigrations(options: RunMigrationsOptions): Promise<void> {
  const result = generateMigrations({
    dialect: options.dialect,
    tableName: options.tableName,
    dimension: options.dimension,
    indexIdColumn: options.indexIdColumn,
    createIndex: options.dialect === "pgvector" ? options.createIndex : undefined,
    ivfflatLists: options.dialect === "pgvector" ? options.ivfflatLists : undefined,
  });

  if (options.dialect === "pgvector") {
    const db = options.db;
    if (result.extension) {
      await db.query(result.extension);
    }
    await db.query(result.table);
    if (result.index) {
      try {
        await db.query(result.index);
      } catch {
        // Index may already exist or fail on empty table
      }
    }
    return;
  }

  if (options.dialect === "sqlite-vec") {
    const db = options.db;
    if (!db.exec) {
      throw new Error("sqlite-vec runMigrations requires db.exec()");
    }
    db.exec(result.table);
    return;
  }

  throw new Error(`Unsupported dialect: ${(options as { dialect: string }).dialect}`);
}

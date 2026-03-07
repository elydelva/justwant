/**
 * Bulk insert via Prisma delegate.createMany.
 */

type PrismaCreateManyDelegate = {
  createMany: (args: { data: Record<string, unknown>[] }) => Promise<{ count: number }>;
};

/**
 * Insert multiple rows in a single query.
 * Note: createMany does not return the created rows, only the count.
 */
export async function bulkInsertPrisma(
  delegate: PrismaCreateManyDelegate,
  rows: Record<string, unknown>[]
): Promise<{ count: number }> {
  if (rows.length === 0) return { count: 0 };
  return delegate.createMany({ data: rows });
}

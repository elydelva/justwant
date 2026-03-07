/**
 * Upsert via Prisma delegate.upsert.
 */

type PrismaUpsertDelegate = {
  upsert: (args: {
    where: Record<string, unknown>;
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }) => Promise<Record<string, unknown>>;
};

/**
 * Upsert a row using Prisma's native upsert.
 * Requires a unique constraint on the where fields.
 */
export async function upsertPrisma(
  delegate: PrismaUpsertDelegate,
  where: Record<string, unknown>,
  create: Record<string, unknown>,
  update: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return delegate.upsert({ where, create, update });
}

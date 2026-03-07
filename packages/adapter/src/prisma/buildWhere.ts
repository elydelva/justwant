/**
 * Build Prisma where clause from Partial<InferContract>.
 * Supports both primitive values and Prisma filter objects.
 */

/**
 * Builds a Prisma where object from a partial contract.
 * Each key-value pair becomes { [fieldName]: value }.
 *
 * Supports Prisma filter objects for advanced queries:
 * - { email: { contains: "x" } }
 * - { id: { in: ["a", "b"] } }
 * - { name: { startsWith: "A" } }
 * - { age: { gte: 18, lt: 65 } }
 */
export function buildPrismaWhere(
  mapping: Record<string, { name: string }>,
  where: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [contractKey, value] of Object.entries(where)) {
    if (value === undefined) continue;
    const col = mapping[contractKey];
    if (!col) continue;
    result[col.name] = value;
  }
  return result;
}

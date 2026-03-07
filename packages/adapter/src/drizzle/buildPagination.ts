/**
 * Build LIMIT and OFFSET for pagination.
 */

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Returns limit and offset for use with Drizzle's .limit() and .offset().
 */
export function buildPagination(options?: PaginationOptions): {
  limit?: number;
  offset?: number;
} {
  if (!options) return {};
  const { limit, offset } = options;
  return { limit, offset };
}

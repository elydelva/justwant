/**
 * MappedTable-specific conformity check.
 */

import type { AnyContract } from "@justwant/contract";
import type { TableContract } from "@justwant/contract";
import { assertTableConforms as _assertTableConforms } from "@justwant/contract/conforms";
import type { MappedTable } from "./table.js";

/**
 * Runtime assertion + cast: verifies table conforms to expected contract,
 * then returns table typed as MappedTable<T["fields"]>.
 */
export function tableConforms<T extends TableContract<AnyContract>>(
  table: MappedTable<AnyContract>,
  expected: T
): MappedTable<T["fields"]> {
  _assertTableConforms(table, expected);
  return table as MappedTable<T["fields"]>;
}

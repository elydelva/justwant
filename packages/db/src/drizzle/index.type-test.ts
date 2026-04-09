/**
 * Type tests: cross-check with @justwant/db.
 * Excluded from build, run via: bun run typecheck
 */

import type { InferContract } from "@justwant/contract";
import { defineContract, field } from "@justwant/contract"; // NOSONAR
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { defineMappedTable } from "./defineMappedTable.js";
import type { MappingFor } from "./mapping.js";
import type { DrizzleMappedTable } from "./types.js";

const UserContract = defineContract({
  id: field<string>().required(), // NOSONAR
  email: field<string>().required(), // NOSONAR
  name: field<string>().optional(), // NOSONAR
});

const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
});

// Mapping must satisfy MappingFor<Table, Contract>
const mapping: MappingFor<typeof usersTable, typeof UserContract> = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
};

const mapped = defineMappedTable(usersTable, UserContract, mapping);

// DrizzleMappedTable extends MappedTable
type Mapped = DrizzleMappedTable<typeof usersTable, typeof UserContract>;
type _Infer = Mapped["infer"];
type _Contract = Mapped["contract"];
type _Internal = Mapped["_internal"];

// infer matches InferContract
const _inferCheck: InferContract<typeof UserContract> = undefined as unknown as _Infer;

// contract is the same
const _contractCheck: typeof UserContract = undefined as unknown as _Contract;

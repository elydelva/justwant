/**
 * Type-level tests for InferContract.
 * Excluded from build; run via `tsc --noEmit` to validate.
 */
import type { InferContract } from "./contract.js";
import { defineContract, field } from "./contract.js";

const UserContract = defineContract({
  id: field<string>().required(),
  email: field<string>().required(),
  name: field<string>().optional(),
  createdAt: field<Date>().required(),
});

type User = InferContract<typeof UserContract>;

// Required fields must be present
const _user: User = {
  id: "1",
  email: "a@b.com",
  createdAt: new Date(),
};

// Optional field can be omitted
const _userNoName: User = {
  id: "2",
  email: "b@c.com",
  createdAt: new Date(),
};

// @ts-expect-error - missing required id
const _bad1: User = {
  email: "x@y.com",
  createdAt: new Date(),
};

// @ts-expect-error - wrong type for email
const _bad2: User = {
  id: "1",
  email: 123,
  createdAt: new Date(),
};

// Empty contract
const EmptyContract = defineContract({});
type Empty = InferContract<typeof EmptyContract>;
const _empty: Empty = {};

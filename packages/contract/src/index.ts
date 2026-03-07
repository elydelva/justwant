/**
 * @justwant/contract - Contract definitions for defineContract, fields, conforms, validate.
 */

export {
  field,
  type AnyContract,
  type FieldDef,
  type InferContract,
  type Infer,
  type TableFields,
} from "./contract.js";
export {
  defineContract,
  type TableContract,
  type StringMapping,
  type DefineContractOptions,
} from "./tableContract.js";
export {
  uuid,
  string,
  number,
  integer,
  boolean,
  date,
  json,
  email,
  url,
  ip,
  ipv4,
  ipv6,
  hostname,
  slug,
  uuidSchema,
  emailSchema,
  urlSchema,
  ipSchema,
  ipv4Schema,
  ipv6Schema,
  hostnameSchema,
  slugSchema,
  type FieldBuilder,
  type FieldBuilderState,
} from "./fields.js";
export { ContractConformityError } from "./errors.js";
export { conformsTo, assertTableConforms, tableConforms } from "./conforms.js";
export type { ConformableTable, ConformsTo } from "./conforms.js";
export {
  validateContractData,
  ContractValidationError,
  type ValidationIssue,
  type ValidationResult,
  type ValidationError,
  type ValidateResult,
  type ValidateOptions,
} from "./validate.js";

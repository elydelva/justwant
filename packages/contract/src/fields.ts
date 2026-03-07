/**
 * Field builders and schemas for defineContract.
 * Isolated entry point: @justwant/contract/fields
 */

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
  type FieldBuilder,
  type FieldBuilderState,
} from "./fieldBuilder.js";
export {
  uuidSchema,
  emailSchema,
  urlSchema,
  ipSchema,
  ipv4Schema,
  ipv6Schema,
  hostnameSchema,
  slugSchema,
} from "./schemas.js";

/**
 * Standard Schema validators for semantic field types.
 * Used by email(), url(), ip(), etc.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const URL_REGEX =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX =
  /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|::)$/;
const IP_REGEX = new RegExp(`(${IPV4_REGEX.source})|(${IPV6_REGEX.source})`);
const HOSTNAME_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function createStringSchema(regex: RegExp, message: string): StandardSchemaV1<unknown, string> {
  return {
    "~standard": {
      version: 1,
      validate: (value: unknown) => {
        if (typeof value !== "string") {
          return { issues: [{ message: "Expected string" }] };
        }
        if (!regex.test(value)) {
          return { issues: [{ message }] };
        }
        return { value };
      },
    },
  } as StandardSchemaV1<unknown, string>;
}

export const uuidSchema: StandardSchemaV1<unknown, string> = createStringSchema(
  UUID_REGEX,
  "Invalid UUID format"
);

export const emailSchema: StandardSchemaV1<unknown, string> = createStringSchema(
  EMAIL_REGEX,
  "Invalid email format"
);

export const urlSchema: StandardSchemaV1<unknown, string> = createStringSchema(
  URL_REGEX,
  "Invalid URL format"
);

export const ipv4Schema: StandardSchemaV1<unknown, string> = createStringSchema(
  IPV4_REGEX,
  "Invalid IPv4 address"
);

export const ipv6Schema: StandardSchemaV1<unknown, string> = createStringSchema(
  IPV6_REGEX,
  "Invalid IPv6 address"
);

export const ipSchema: StandardSchemaV1<unknown, string> = createStringSchema(
  IP_REGEX,
  "Invalid IP address"
);

export const hostnameSchema: StandardSchemaV1<unknown, string> = createStringSchema(
  HOSTNAME_REGEX,
  "Invalid hostname"
);

export const slugSchema: StandardSchemaV1<unknown, string> = createStringSchema(
  SLUG_REGEX,
  "Invalid slug (use lowercase letters, numbers, hyphens)"
);

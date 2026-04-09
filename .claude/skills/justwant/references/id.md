# @justwant/id

ID generation. Subpath imports only — no root export. Two strategies: ULID (sortable) and nanoid (short).

## Install

```bash
bun add @justwant/id
```

## Subpaths

| Subpath | Algorithm | Format | Use case |
|---------|-----------|--------|----------|
| `@justwant/id/sortable` | ULID | 26-char base32 | DB primary keys |
| `@justwant/id/short` | nanoid | 21-char URL-safe | Public IDs, tokens, slugs |
| `@justwant/id/primitives` | ulid + nanoid | raw | Advanced / custom use |

**Important**: Both `/sortable` and `/short` export `createId`. Alias when importing both.

```ts
import { createId as createSortableId } from "@justwant/id/sortable";
import { createId as createShortId } from "@justwant/id/short";
```

## @justwant/id/sortable

```ts
import { createId, getTimestamp } from "@justwant/id/sortable";
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `createId` | `() => string` | 26-char uppercase base32 ULID |
| `getTimestamp` | `(id: string) => number` | Extract ms-precision Unix timestamp; throws if invalid |

**ULID properties**: 128 bits (48-bit timestamp + 80-bit random), lexicographically sortable, monotonic within the same ms, UUID-compatible.

```ts
const id = createId();        // "01ARYZ6S41TPTWJ6SXKWG5FPFR"
const ms = getTimestamp(id);  // milliseconds since epoch
```

## @justwant/id/short

```ts
import { createId } from "@justwant/id/short";
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `createId` | `(size?: number) => string` | URL-safe nanoid; default 21 chars |

**Default alphabet**: `A-Za-z0-9_-`. Cryptographically random (`crypto.getRandomValues`). Not time-sortable.

```ts
const id    = createId();    // "V1StGXR8_Z5jdHi6B-myT" (21 chars, ~126 bits)
const short = createId(8);   // "V1StGXR8"              (8 chars, ~48 bits)
```

### Length vs. collision probability
| Length | ~Bits |
|--------|-------|
| 8 | ~48 |
| 12 | ~72 |
| 16 | ~96 |
| 21 (default) | ~126 |

## @justwant/id/primitives

Raw library exports for advanced use cases.

```ts
import {
  // From ulid
  ulid,               // (seedTime?: number) => string
  isValid,            // (id: string) => boolean
  decodeTime,         // (id: string) => number  — same as getTimestamp
  monotonicFactory,   // (prng?) => (seedTime?) => string  — monotonic generator
  // From nanoid
  nanoid,             // (size?: number) => string  — same as createId from /short
  customAlphabet,     // (alphabet: string, size?: number) => (size?: number) => string
} from "@justwant/id/primitives";

// Custom alphabet example
const numeric = customAlphabet("0123456789", 6);
numeric(); // "391490"
```

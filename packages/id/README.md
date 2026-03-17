# @justwant/id

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ID generation: **sortable** (by time) and **short** (URL-safe). Simple function names, evocative export paths, tool-agnostic. Subpath imports only.

## Installation

```bash
bun add @justwant/id
# or
npm install @justwant/id
# or
pnpm add @justwant/id
```

## Usage

### Sortable IDs

IDs that sort by creation time. Good for primary keys and ordering.

```ts
import { createId, getTimestamp } from "@justwant/id/sortable";

const id = createId();
// => "01ARZ3NDEKTSV4RRFFQ69G5FAV"

getTimestamp(id); // creation time in ms
```

### Short IDs

Short, URL-safe IDs. Good for public IDs, slugs, short links.

```ts
import { createId } from "@justwant/id/short";

const id = createId();
// => "V1StGXR8_Z5jdHi6B-myT"

createId(10); // custom length
```

### Primitives

Raw lib exports for advanced use (monotonic counters, custom alphabets, etc.).

```ts
import { ulid, nanoid, decodeTime, monotonicFactory, customAlphabet } from "@justwant/id/primitives";
```

## Exports

| Subpath                 | Purpose                          |
|-------------------------|----------------------------------|
| `@justwant/id/sortable` | `createId()`, `getTimestamp(id)` — time-sortable |
| `@justwant/id/short`    | `createId(size?)` — short URL-safe |
| `@justwant/id/primitives` | `ulid`, `nanoid`, `decodeTime`, `isValid`, `monotonicFactory`, `customAlphabet` |

## API

| Export | Description |
|--------|-------------|
| `createId()` (sortable) | Time-sortable ID (ULID-based) |
| `getTimestamp(id)` | Extract creation time from sortable ID |
| `createId(size?)` (short) | Short URL-safe ID (nanoid-based) |

## License

MIT

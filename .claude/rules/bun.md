# Bun — Runtime & Tooling

Default to using Bun instead of Node.js.

## CLI

- `bun <file>` instead of `node <file>` or `ts-node <file>`
- `bun test` instead of `jest` or `vitest`
- `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- `bun install` instead of `npm install` / `yarn install` / `pnpm install`
- `bun run <script>` instead of `npm run` / `yarn run` / `pnpm run`
- `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads `.env` — do not use `dotenv`.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes — don't use `express`.
- `bun:sqlite` for SQLite — don't use `better-sqlite3`.
- `Bun.redis` for Redis — don't use `ioredis`.
- `Bun.sql` for Postgres — don't use `pg` or `postgres.js`.
- `WebSocket` is built-in — don't use `ws`.
- `Bun.file` instead of `node:fs` readFile/writeFile.
- `Bun.$\`cmd\`` instead of `execa`.

## Testing

```ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. Supports React, CSS, Tailwind out of the box.

Run with: `bun --hot ./index.ts`

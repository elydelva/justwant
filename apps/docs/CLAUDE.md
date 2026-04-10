# Documentation guide — @justwant packages

This file describes how to structure the documentation for any `@justwant/*` package. Follow these rules exactly when creating or updating a package's doc folder under `content/docs/<package>/`.

---

## Folder structure

All pages are **flat files** inside `content/docs/<package>/`. No subfolders. Every section listed in `meta.json` references flat `.mdx` files at the same level.

```
content/docs/<package>/
  meta.json
  index.mdx
  installation.mdx
  basic-usage.mdx
  # concepts (one file per concept)
  # guides (one file per guide)
  # interchangeable units — see below
  # plugins (one file per plugin)
  errors.mdx         # if the package defines error types
  api.mdx
```

---

## `meta.json` structure

Sections are declared as `"---Section name---"` separators. The order is fixed:

```json
{
  "title": "Package Name",
  "icon": "SomeIcon",
  "pages": [
    "index",
    "---Get Started---",
    "installation",
    "basic-usage",
    "---Concepts---",
    "concept-a",
    "concept-b",
    "---Guides---",
    "guide-a",
    "guide-b",
    "---<Interchangeable units>---",
    "which-x",
    "unit-a",
    "unit-b",
    "---Extend---",
    "plugin-a",
    "plugin-b",
    "---Reference---",
    "errors",
    "api"
  ]
}
```

Omit any section that has nothing to put in it. `errors` is only included if the package exports named error classes.

---

## Sections

### `index.mdx` — Introduction

High-level overview: what the package does, what problem it solves, and a minimal code example. No installation steps here.

### `---Get Started---`

Always two pages, always in this order:

- `installation.mdx` — `bun add` command, peer dependencies if any
- `basic-usage.mdx` — minimal working example from zero to first working call

### `---Concepts---`

One page per core concept that a user needs to understand before using the package effectively. Concepts explain the mental model — they are not how-to guides and do not list providers.

Examples: `ttl.mdx`, `namespace.mdx`, `tags.mdx` (cache) — `templates.mdx` (notify) — `schema.mdx`, `dialects.mdx` (warehouse).

### `---Guides---`

One page per common real-world use case. Guides are task-oriented: they show how to accomplish something specific using the package's API. Read the source code before writing guides — base them on what is actually exported and tested.

Examples: `multi-channel.mdx`, `error-handling.mdx`, `job-alerts.mdx` (notify).

### `---<Interchangeable units>---` — the modular section

This section lists the interchangeable backends, implementations, or delivery mechanisms the package supports. The section name depends on the package domain:

| Domain | Section name | Example packages |
|--------|-------------|-----------------|
| Storage backends, DB adapters | `---Providers---` | `db`, `storage`, `warehouse`, `cache` |
| Delivery channels | `---Channels---` | `notify` |
| AI model backends | `---Engines---` | `embedding` (for model providers) |
| Vector storage backends | `---Vector Stores---` | `embedding` (for vector DBs) |

A package can have multiple interchangeable unit sections if the units are conceptually distinct (e.g. `embedding` has both `---Engines---` and `---Vector Stores---`).

#### Overview page — "Which X?"

The first page in the section is always an overview that helps the user choose. It must follow this pattern:

```mdx
---
title: Which provider?      # or: Which channel? / Which engine? / Which storage?
description: …
icon: MessageCircleQuestionMark
---
```

The filename matches the section concept: `providers.mdx`, `channels.mdx`, `engines.mdx`, `storages.mdx`.

#### Individual unit pages

One page per unit (provider, channel, engine, etc.). The title is **just the name** — no suffix:

```mdx
---
title: Resend        # ✓  not "Resend Provider" or "Resend Adapter"
title: Email         # ✓  not "Email Channel"
title: OpenAI        # ✓  not "OpenAI Engine"
---
```

The section in the sidebar already provides the context. Do not repeat it in the title.

### `---Extend---`

One page per plugin exported by the package. No overview page — just individual plugin pages.

**Title:** just the plugin name, no "plugin" suffix:

```mdx
---
title: Audit         # ✓  not "Audit Plugin"
---
```

**Filename:** slug of the plugin name — `audit.mdx`, `lock.mdx`, `alert.mdx`.

**Each plugin page must cover, in this order:**
1. **Overview** — what the plugin does and when to use it
2. **Import** — the exact subpath import (`@justwant/<package>/plugins/<name>`)
3. **Setup** — minimal working example wired into `create<Package>({ plugins: [...] })`
4. **Options** — a table of the plugin's option type fields (name, type, required, description)
5. **Custom plugin** — only if the package exposes a plugin interface type (e.g. `NotifyPlugin`, `CachePlugin`); show how to implement one from scratch

**Source-first:** always read `src/plugins/<name>.ts` before writing. Document only what is actually exported. Do not invent options or behaviours.

### `---Reference---`

#### `errors.mdx`

Only include if the package exports named error classes. List every exported error with:
- The class name and what triggers it
- Which fields it exposes
- An `instanceof` example

Title: `Errors` — icon: `CircleAlert`.

#### `api.mdx`

Complete API reference for everything exported from the package's main entry and subpaths. Document every public function and type.

Title: `API Reference` — icon: `BookOpen`.

---

## Rules

1. **Read the source before writing.** Every code example must match the actual exported API. Check `src/index.ts` for exports, `src/types.ts` for interfaces, and `src/plugins/` for plugins.

2. **No subfolders.** All pages are flat inside the package folder. If you find yourself wanting a subfolder, add a section separator in `meta.json` instead.

3. **One page per thing.** One page per concept, one per guide, one per provider/channel/engine, one per plugin. No combined pages.

4. **Titles carry no context suffix.** The section name in the sidebar provides the context. Titles are just the name: `Email`, `Resend`, `Audit` — never `Email Channel`, `Resend Provider`, `Audit Plugin`.

5. **"Which X?" pages use `MessageCircleQuestionMark`.** Every interchangeable unit section starts with a comparison/overview page using this icon.

6. **Guides come from the code.** Only write a guide if there is an actual exported API or documented pattern to demonstrate. Cross-package guides (e.g. `job-alerts.mdx` using `createAlertNotifier`) are valid when the function is exported from the package.

7. **`errors` is optional.** Only add it if the package exports named error classes. Do not add a generic error handling page under Reference — that belongs in Guides.

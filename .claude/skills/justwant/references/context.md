# @justwant/context

Request context with explicit propagation. defineSlot, createContextService. No AsyncLocalStorage.

## Usage

```ts
import { createContextService, defineSlot } from "@justwant/context";

const userSlot = defineSlot({
  key: "user",
  scope: "on-demand",
  resolve: async (ctx) => userApi.findById(ctx.initial.userId as string),
});

const orgSlot = defineSlot({
  key: "org",
  scope: "on-demand",
  resolve: async (ctx) => {
    const user = await ctx.get(userSlot);
    return orgApi.findById(ctx.initial.orgId as string);
  },
});

const ctx = createContextService({ slots: [userSlot, orgSlot] });
const requestCtx = ctx.forRequest({ userId: req.user?.id, orgId: req.headers["x-org-id"] });
const user = await requestCtx.get(userSlot); // resolved once, cached
```

## Slot scopes

| Scope | When resolved |
|-------|---------------|
| eager | At forRequest() |
| request | At forRequest() |
| on-demand | At first get() |

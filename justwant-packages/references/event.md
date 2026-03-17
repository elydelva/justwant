# @justwant/event

Typed event bus. defineEvent, createEventBus. Wildcard patterns: user.*, *.

## Usage

```ts
import { defineEvent, createEventBus } from "@justwant/event";

const UserCreated = defineEvent("user.created", (id: string, email: string) => ({ id, email }));
const bus = createEventBus({ events: [UserCreated] });

bus.emit(UserCreated, "1", "a@b.com");
bus.listen(UserCreated, ({ id, email }) => console.log(id, email));
bus.listen("user.*", (payload) => {}); // wildcard
bus.listenOnce(UserCreated, handler);
bus.unlisten(UserCreated, handler);
```

## Primitive

createPrimitiveEventBus from event/primitive for dynamic event names.

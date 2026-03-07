import { createPrimitiveEventBus } from "./primitive.js";

export interface TypedEvent<
  TArgs extends unknown[] = unknown[],
  TPayload = unknown,
  TType extends string = string,
> {
  readonly type: TType;
  createPayload(...args: TArgs): TPayload;
}

export function defineEvent<TName extends string, TArgs extends unknown[], TPayload>(
  name: TName,
  builder: (...args: TArgs) => TPayload
): TypedEvent<TArgs, TPayload, TName> {
  return {
    type: name,
    createPayload: (...args: TArgs) => builder(...args),
  };
}

export type TypedEventMap = Record<string, TypedEvent<unknown[], unknown>>;

/** Extract prefix from "user.created" -> "user" */
type ExtractPrefix<T extends string> = T extends `${infer P}.${string}` ? P : never;
/** Event types from events array */
type EventTypes<TEvents extends readonly TypedEvent<unknown[], unknown>[]> =
  TEvents[number]["type"];
/** Wildcard patterns: "user.*" | "order.*" | "*" */
type PrefixToWildcard<T extends string> = `${T}.*`;
type WildcardPatterns<TEvents extends readonly TypedEvent<unknown[], unknown>[]> =
  | "*"
  | PrefixToWildcard<ExtractPrefix<EventTypes<TEvents>>>;

export type { WildcardPatterns };
/** Events matching prefix "user.*" */
type EventsMatchingPrefix<
  TEvents extends readonly TypedEvent<unknown[], unknown>[],
  P extends string,
> = Extract<TEvents[number], { type: `${P}.${string}` }>;
/** Event object for a given type string */
type EventByType<
  TEvents extends readonly TypedEvent<unknown[], unknown>[],
  T extends string,
> = Extract<TEvents[number], { type: T }>;
type PayloadUnion<T> = T extends TypedEvent<infer _A, infer P> ? P : never;
/** Args for emit (from TypedEvent or type string) */
export type EmitArgsForPattern<
  TEvents extends readonly TypedEvent<unknown[], unknown>[],
  Pattern,
> = Pattern extends TypedEvent<infer A, infer _P>
  ? A
  : Pattern extends EventTypes<TEvents>
    ? EventByType<TEvents, Pattern> extends TypedEvent<infer A, infer _P>
      ? A
      : never
    : never;
/** Payload type for a listen pattern (event, "user.created", "user.*", or "*") */
export type PayloadForPattern<
  TEvents extends readonly TypedEvent<unknown[], unknown>[],
  Pattern,
> = Pattern extends TypedEvent<infer _A, infer P>
  ? P
  : Pattern extends "*"
    ? PayloadUnion<TEvents[number]>
    : Pattern extends `${infer P}.*`
      ? PayloadUnion<EventsMatchingPrefix<TEvents, P & string>>
      : Pattern extends EventTypes<TEvents>
        ? EventByType<TEvents, Pattern> extends TypedEvent<infer _A, infer P>
          ? P
          : never
        : never;

export interface CreateTypedEventBusOptions<
  TEvents extends readonly TypedEvent<unknown[], unknown>[] = TypedEvent<unknown[], unknown>[],
> {
  events: TEvents;
  /** Enable wildcard patterns (user.*, *) for listen/listenOnce. Default: true */
  wildcard?: boolean;
}

type EmitPattern<TEvents extends readonly TypedEvent<unknown[], unknown>[]> =
  | TEvents[number]
  | EventTypes<TEvents>;

type ListenPattern<
  TEvents extends readonly TypedEvent<unknown[], unknown>[],
  W extends boolean,
> = W extends false
  ? TEvents[number] | EventTypes<TEvents>
  : TEvents[number] | EventTypes<TEvents> | WildcardPatterns<TEvents>;

type EventBusListen<
  TEvents extends readonly TypedEvent<unknown[], unknown>[],
  W extends boolean,
> = {
  emit<Pattern extends EmitPattern<TEvents>>(
    event: Pattern,
    ...args: EmitArgsForPattern<TEvents, Pattern>
  ): void | Promise<void>;
  listen<Pattern extends ListenPattern<TEvents, W>>(
    event: Pattern,
    handler: (payload: PayloadForPattern<TEvents, Pattern>) => void | Promise<void>
  ): () => void;
  listenOnce<Pattern extends ListenPattern<TEvents, W>>(
    event: Pattern,
    handler: (payload: PayloadForPattern<TEvents, Pattern>) => void | Promise<void>
  ): () => void;
  unlisten<Pattern extends ListenPattern<TEvents, W>>(
    event: Pattern,
    handler: (payload: PayloadForPattern<TEvents, Pattern>) => void | Promise<void>
  ): void;
};

export type EventBus<
  TEvents extends readonly TypedEvent<unknown[], unknown>[],
  W extends boolean = true,
> = EventBusListen<TEvents, W>;

export function createEventBus<TEvents extends readonly TypedEvent<unknown[], unknown>[]>(
  options: CreateTypedEventBusOptions<TEvents> & { wildcard?: true }
): EventBus<TEvents, true>;
export function createEventBus<TEvents extends readonly TypedEvent<unknown[], unknown>[]>(
  options: CreateTypedEventBusOptions<TEvents> & { wildcard: false }
): EventBus<TEvents, false>;
export function createEventBus<TEvents extends readonly TypedEvent<unknown[], unknown>[]>(
  options: CreateTypedEventBusOptions<TEvents> & { wildcard?: boolean }
): EventBus<TEvents, boolean> {
  const { events, wildcard = true } = options;
  const bus = createPrimitiveEventBus();

  const eventByType = new Map<string, TypedEvent<unknown[], unknown>>();
  for (const ev of events) {
    eventByType.set(ev.type, ev);
  }

  function getEvent(event: TEvents[number] | string): TypedEvent<unknown[], unknown> {
    return typeof event === "string"
      ? (eventByType.get(event) as TypedEvent<unknown[], unknown>)
      : (event as TypedEvent<unknown[], unknown>);
  }

  function getPattern(event: TEvents[number] | string): string {
    return typeof event === "string" ? event : (event as TypedEvent<unknown[], unknown>).type;
  }

  const result = {
    emit(event: TEvents[number] | string, ...args: unknown[]) {
      const ev = getEvent(event);
      const payload = ev.createPayload(...args);
      return bus.emit(ev.type, payload);
    },

    listen(event: TEvents[number] | string, handler: (payload: unknown) => void | Promise<void>) {
      return bus.listen(getPattern(event), handler);
    },

    listenOnce(
      event: TEvents[number] | string,
      handler: (payload: unknown) => void | Promise<void>
    ) {
      return bus.listenOnce(getPattern(event), handler);
    },

    unlisten(event: TEvents[number] | string, handler: (payload: unknown) => void | Promise<void>) {
      bus.unlisten(getPattern(event), handler);
    },
  };

  return result as EventBus<TEvents, boolean>;
}

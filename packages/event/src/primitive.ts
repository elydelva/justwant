type Handler<T = unknown> = (payload: T) => void | Promise<void>;

/**
 * Wildcard patterns ("user.*", "*") match emitted events.
 * Exact patterns ("user.created") match only that specific event.
 * "user.*" matches "user.created", "user.updated" but NOT "user" (no suffix).
 */
function matchesPattern(type: string, pattern: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -2);
    // Must have prefix. + at least one char (exclude bare "user" or "user.")
    return type.startsWith(`${prefix}.`) && type.length > prefix.length + 1;
  }
  return type === pattern;
}

export interface EventBus {
  emit(type: string, payload?: unknown): void | Promise<void>;
  listen<T = unknown>(type: string, handler: Handler<T>): () => void;
  listenOnce<T = unknown>(type: string, handler: Handler<T>): () => void;
  unlisten(type: string, handler: Handler): void;
}

export function createPrimitiveEventBus(): EventBus {
  const handlers = new Map<string, Set<Handler>>();

  function getHandlers(pattern: string): Set<Handler> {
    let set = handlers.get(pattern);
    if (!set) {
      set = new Set();
      handlers.set(pattern, set);
    }
    return set;
  }

  function getMatchingHandlers(type: string): Handler[] {
    const result: Handler[] = [];
    for (const [pattern, set] of handlers) {
      if (matchesPattern(type, pattern)) {
        for (const h of set) result.push(h);
      }
    }
    return result;
  }

  return {
    emit(type: string, payload?: unknown): void | Promise<void> {
      const toRun = getMatchingHandlers(type);
      if (toRun.length === 0) return;

      const results = toRun.map((h) => h(payload));
      const hasPromise = results.some(
        (r) => r && typeof (r as Promise<unknown>).then === "function"
      );
      if (hasPromise) {
        return Promise.all(results as Promise<void>[]) as unknown as Promise<void>;
      }
    },

    listen<T = unknown>(type: string, handler: Handler<T>): () => void {
      getHandlers(type).add(handler as Handler);
      return () => this.unlisten(type, handler as Handler);
    },

    listenOnce<T = unknown>(type: string, handler: Handler<T>): () => void {
      const once: Handler<T> = (payload) => {
        handlers.get(type)?.delete(once as Handler);
        return (handler as Handler)(payload);
      };
      getHandlers(type).add(once as Handler);
      return () => handlers.get(type)?.delete(once as Handler);
    },

    unlisten(type: string, handler: Handler): void {
      handlers.get(type)?.delete(handler);
    },
  };
}

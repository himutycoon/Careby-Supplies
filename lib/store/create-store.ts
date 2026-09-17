/**
 * Minimal external-store factory.
 *
 * The project's stack is locked to "no state library — server components
 * and useState only", so shared client state lives in tiny external
 * stores read through useSyncExternalStore. That keeps localStorage an
 * external system (never state synced in an effect) and gives a stable
 * server snapshot for SSR.
 */
export interface PersistedStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  get: () => T;
  set: (updater: T | ((current: T) => T)) => void;
  reset: () => void;
}

export function createPersistedStore<T>(
  storageKey: string,
  initialValue: T,
): PersistedStore<T> {
  let value = initialValue;
  let loaded = false;
  const listeners = new Set<() => void>();

  function read(): T {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      // Private mode / blocked storage — fall back to the initial value.
      return initialValue;
    }
  }

  function ensureLoaded() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    value = read();
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function persist() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Storage unavailable — state stays in memory for this session.
    }
  }

  return {
    subscribe(listener) {
      ensureLoaded();
      listeners.add(listener);

      const onStorage = (event: StorageEvent) => {
        if (event.key !== storageKey) return;
        value = read();
        emit();
      };
      window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },

    getSnapshot() {
      ensureLoaded();
      return value;
    },

    getServerSnapshot() {
      return initialValue;
    },

    get() {
      ensureLoaded();
      return value;
    },

    set(updater) {
      ensureLoaded();
      value =
        typeof updater === "function"
          ? (updater as (current: T) => T)(value)
          : updater;
      persist();
      emit();
    },

    reset() {
      value = initialValue;
      persist();
      emit();
    },
  };
}

/** Prototype-stage id generator — swap for server ids when the API lands. */
export function generateId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

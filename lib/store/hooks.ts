"use client";

import * as React from "react";
import type { PersistedStore } from "@/lib/store/create-store";
import { cartStore, userTypeStore } from "@/lib/store/app-store";
import { createClient } from "@/lib/supabase/client";

function useStore<T>(store: PersistedStore<T>): T {
  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}

export const useCartLines = () => useStore(cartStore);
export const useUserType = () => useStore(userTypeStore);

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Standard async read for Supabase-backed screens, giving every caller
 * the loading / error / empty states the UI needs (spec §18).
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList = [],
): AsyncState<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();

  // Held in a ref so a new inline loader closure doesn't retrigger the
  // fetch — `deps` is what decides when to reload.
  const loaderRef = React.useRef(loader);

  React.useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  React.useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      try {
        const result = await loaderRef.current();
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (err) {
        console.error("[useAsyncData]", err);
        if (!cancelled) setError("We couldn't load this. Please try again.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  return {
    data,
    loading: isPending || !loaded,
    error,
    reload: () => setReloadKey((k) => k + 1),
  };
}

/**
 * Re-runs `onChange` when any row in `table` changes (spec §16).
 *
 * RLS applies to realtime exactly as it does to queries, so a subscriber
 * is only told about rows it could already read — this widens nothing.
 * The table must be in the supabase_realtime publication (schema-06);
 * if it isn't, the channel simply never fires and the screen behaves
 * exactly as it did before.
 */
export function useRealtimeRefresh(
  table: string,
  onChange: () => void,
  enabled = true,
): void {
  // Ref so a caller passing an inline arrow doesn't tear down and
  // rebuild the channel on every render.
  const handlerRef = React.useRef(onChange);

  React.useEffect(() => {
    handlerRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => handlerRef.current(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, enabled]);
}

"use client";
import { useEffect, useReducer, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { campusService } from "@/services";
import type { CollectionMap, CollectionName } from "@/types/service-contracts";
export function usePrivateCatalog<K extends CollectionName>(collection: K) {
  const owner = useAuthStore((s) =>
      s.user && s.hydrated
        ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
        : "",
    ),
    [nonce, refresh] = useReducer((n) => n + 1, 0),
    [state, setState] = useState<{
      owner: string;
      items: CollectionMap[K][];
      error: string;
      loading: boolean;
    }>({ owner: "", items: [], error: "", loading: false });
  useEffect(() => {
    const c = new AbortController();
    if (owner)
      void Promise.resolve().then(async () => {
        if (c.signal.aborted) return;
        setState({ owner, items: [], error: "", loading: true });
        try {
          const page = await campusService.list(collection, {
            pageSize: 30,
            signal: AbortSignal.any([c.signal, AbortSignal.timeout(8000)]),
          });
          if (!c.signal.aborted)
            setState({ owner, items: page.items, error: "", loading: false });
        } catch (e) {
          if (!c.signal.aborted)
            setState({
              owner,
              items: [],
              error:
                e instanceof Error
                  ? e.message
                  : "Your campus source could not load.",
              loading: false,
            });
        }
      });
    return () => c.abort();
  }, [owner, nonce, collection]);
  return {
    items: owner && state.owner === owner ? state.items : [],
    error: state.owner === owner ? state.error : "",
    loading: !!owner && (state.owner !== owner || state.loading),
    ready: !!owner,
    refresh,
  };
}

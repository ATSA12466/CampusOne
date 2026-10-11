"use client";
import { useEffect, useReducer, useState, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { workspaceService } from "@/services";
import type { WorkspaceCollection, WorkspaceMap } from "@/types/workspace";
export function useWorkspace<K extends WorkspaceCollection>(collection: K) {
  const owner = useAuthStore((s) =>
      s.user && s.hydrated
        ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
        : "",
    ),
    [nonce, refresh] = useReducer((v) => v + 1, 0),
    [state, setState] = useState<{
      owner: string;
      items: WorkspaceMap[K][];
      error: string;
      loading: boolean;
    }>({ owner: "", items: [], error: "", loading: false }),
    [busyOwner, setBusyOwner] = useState(""),
    [notice, setNotice] = useState({ owner: "", text: "" }),
    controller = useRef<AbortController | null>(null);
  const live = () => {
    const s = useAuthStore.getState();
    return s.user && s.hydrated
      ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
      : "";
  };
  useEffect(() => {
    const request = new AbortController();
    if (owner)
      void Promise.resolve().then(async () => {
        if (request.signal.aborted) return;
        setState({ owner, items: [], error: "", loading: true });
        try {
          const items = await workspaceService.list(collection, {
            signal: request.signal,
          });
          if (!request.signal.aborted && owner === live())
            setState({ owner, items, error: "", loading: false });
        } catch (e) {
          if (!request.signal.aborted && owner === live())
            setState({
              owner,
              items: [],
              error:
                e instanceof Error
                  ? e.message
                  : "Your workspace could not load.",
              loading: false,
            });
        }
      });
    return () => {
      request.abort();
      controller.current?.abort();
      controller.current = null;
    };
  }, [owner, nonce, collection]);
  const mutate = async (item: WorkspaceMap[K] | string) => {
    if (!owner) throw new Error("Sign in before making changes.");
    if (controller.current) throw new Error("A change is already pending.");
    const request = new AbortController();
    controller.current = request;
    setBusyOwner(owner);
    setNotice({ owner, text: "" });
    try {
      const result =
        typeof item === "string"
          ? await workspaceService.remove(collection, item, {
              signal: request.signal,
            })
          : await workspaceService.put(collection, item, {
              signal: request.signal,
            });
      if (request.signal.aborted || owner !== live()) return;
      setNotice({
        owner,
        text: result.persisted
          ? workspaceService.source === "demo"
            ? "Saved on this device only. No real person or service was contacted."
            : "The connected service accepted this change."
          : "For this visit only. Device storage is unavailable.",
      });
      refresh();
    } finally {
      if (controller.current === request) {
        controller.current = null;
        setBusyOwner("");
      }
    }
  };
  return {
    items: state.owner === owner ? state.items : [],
    error: state.owner === owner ? state.error : "",
    loading: !!owner && (state.owner !== owner || state.loading),
    ready: !!owner,
    owner,
    busy: busyOwner === owner && !!owner,
    notice: notice.owner === owner ? notice.text : "",
    refresh,
    put: (item: WorkspaceMap[K]) => mutate(item),
    remove: (id: string) => mutate(id),
  };
}

"use client";
import { useEffect, useReducer, useState, useRef } from "react";
import {
  privateWorkspaceKey,
  invalidateWorkspaceStorage,
} from "@/lib/workspace/storage";
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
  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (
        event as CustomEvent<{ owner: string; collection: string }>
      ).detail;
      if (detail?.owner === owner && detail.collection === collection)
        refresh();
    };
    const external = (event: StorageEvent) => {
      const state = useAuthStore.getState();
      const key = privateWorkspaceKey(state.source, state.user);
      if (key && (!event.key || event.key === `${key}:${collection}`)) {
        invalidateWorkspaceStorage(event.key);
        refresh();
      }
    };
    window.addEventListener("campusone-workspace-updated", listener);
    window.addEventListener("storage", external);
    return () => {
      window.removeEventListener("campusone-workspace-updated", listener);
      window.removeEventListener("storage", external);
    };
  }, [owner, collection]);
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
      if (request.signal.aborted || owner !== live())
        throw new DOMException(
          "The account changed or the request was interrupted.",
          "AbortError",
        );
      setNotice({
        owner,
        text: result.persisted
          ? workspaceService.source === "demo"
            ? "Saved on this device only. No real person or service was contacted."
            : "The connected service accepted this change."
          : "For this visit only. Device storage is unavailable.",
      });
      window.dispatchEvent(
        new CustomEvent("campusone-workspace-updated", {
          detail: { owner, collection },
        }),
      );
    } catch (cause) {
      if (!request.signal.aborted && owner === live())
        setNotice({
          owner,
          text:
            cause instanceof Error
              ? cause.message
              : "Your change could not save. Please retry.",
        });
      throw cause;
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

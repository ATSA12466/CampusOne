"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { campusActionService } from "@/services";
import type { CampusActivity } from "@/types/campus-operations";
const empty: CampusActivity = { savedAnnouncementIds: [], requests: [] };
export function useCampusActivity() {
  const owner = useAuthStore((s) =>
      s.user && s.hydrated
        ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
        : "",
    ),
    bookmarks = useAppStore((s) => s.bookmarks),
    requests = useAppStore((s) => s.srcRequests),
    [nonce, refresh] = useReducer((n) => n + 1, 0),
    [state, setState] = useState({
      owner: "",
      data: empty,
      error: "",
      loading: false,
    }),
    [busyOwner, setBusy] = useState(""),
    [notice, setNotice] = useState({ owner: "", text: "" }),
    controller = useRef<AbortController | null>(null);
  const live = () => {
    const s = useAuthStore.getState();
    return s.user && s.hydrated
      ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
      : "";
  };
  useEffect(() => {
    const c = new AbortController();
    if (owner && campusActionService.source === "api")
      void Promise.resolve().then(async () => {
        if (c.signal.aborted) return;
        setState({ owner, data: empty, error: "", loading: true });
        try {
          const data = await campusActionService.activity({ signal: c.signal });
          if (!c.signal.aborted && live() === owner)
            setState({ owner, data, error: "", loading: false });
        } catch (e) {
          if (!c.signal.aborted && live() === owner)
            setState({
              owner,
              data: empty,
              error:
                e instanceof Error
                  ? e.message
                  : "Your campus activity could not load.",
              loading: false,
            });
        }
      });
    return () => {
      c.abort();
      controller.current?.abort();
      controller.current = null;
    };
  }, [owner, nonce]);
  const run = async (
    action: (signal: AbortSignal) => Promise<{ persisted: boolean }>,
  ) => {
    if (!owner || controller.current) return false;
    const c = new AbortController();
    controller.current = c;
    setBusy(owner);
    setNotice({ owner, text: "" });
    try {
      const result = await action(c.signal);
      if (c.signal.aborted || live() !== owner) return false;
      refresh();
      setNotice({
        owner,
        text: result.persisted
          ? campusActionService.source === "demo"
            ? "Saved on this device only. No university office was contacted."
            : "The connected service accepted this change."
          : "Saved for this visit only. Device storage is unavailable.",
      });
      return true;
    } catch (e) {
      if (!c.signal.aborted && live() === owner)
        setNotice({
          owner,
          text:
            e instanceof Error ? e.message : "This action could not finish.",
        });
      return false;
    } finally {
      if (controller.current === c) controller.current = null;
      setBusy((s) => (s === owner ? "" : s));
    }
  };
  const data = owner
    ? campusActionService.source === "demo"
      ? {
          savedAnnouncementIds: bookmarks
            .filter((b) => b.entityType === "announcement")
            .map((b) => b.entityId),
          requests,
        }
      : state.owner === owner
        ? state.data
        : empty
    : empty;
  return {
    ...data,
    ready: !!owner,
    loading:
      !!owner &&
      campusActionService.source === "api" &&
      (state.owner !== owner || state.loading),
    error: owner && state.owner === owner ? state.error : "",
    busy: !!owner && busyOwner === owner,
    notice: owner && notice.owner === owner ? notice.text : "",
    refresh,
    run,
  };
}
export type CampusActivityState = ReturnType<typeof useCampusActivity>;

"use client";
import { useEffect, useReducer, useState } from "react";
import { discoverActionService } from "@/services";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { discoverSavedFromBookmarks } from "@/lib/discover/bookmarks";
import type { DiscoverActivity } from "@/types/discover";
export const discoverOwner = () => {
  const state = useAuthStore.getState();
  return `${state.source}:${state.user?.id}:${state.user?.email}:${state.role}`;
};
export function useDiscoverActivity() {
  const user = useAuthStore((state) => state.user),
    hydrated = useAuthStore((state) => state.hydrated),
    owner = useAuthStore(
      (state) =>
        `${state.source}:${state.user?.id}:${state.user?.email}:${state.role}`,
    ),
    bookmarks = useAppStore((state) => state.bookmarks),
    [nonce, refresh] = useReducer((value) => value + 1, 0),
    [remote, setRemote] = useState<{
      owner: string;
      activity: DiscoverActivity;
      loading: boolean;
      error: string;
    }>({ owner: "", activity: { saved: [] }, loading: false, error: "" });
  useEffect(() => {
    if (discoverActionService.source === "demo" || !user || !hydrated) return;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setRemote({ owner, activity: { saved: [] }, loading: true, error: "" });
      try {
        const activity = await discoverActionService.activity({
          signal: controller.signal,
        });
        if (!controller.signal.aborted && owner === discoverOwner())
          setRemote({ owner, activity, loading: false, error: "" });
      } catch (cause) {
        if (!controller.signal.aborted && owner === discoverOwner())
          setRemote({
            owner,
            activity: { saved: [] },
            loading: false,
            error:
              cause instanceof Error
                ? cause.message
                : "Your saved campus items could not load.",
          });
      }
    });
    return () => controller.abort();
  }, [owner, user, hydrated, nonce]);
  if (discoverActionService.source === "demo")
    return {
      saved: user && hydrated ? discoverSavedFromBookmarks(bookmarks) : [],
      loading: !hydrated,
      error: "",
      refresh,
    };
  return {
    saved: user && remote.owner === owner ? remote.activity.saved : [],
    loading:
      !hydrated || (!!user && (remote.owner !== owner || remote.loading)),
    error: remote.owner === owner ? remote.error : "",
    refresh,
  };
}
export type DiscoverActivityState = ReturnType<typeof useDiscoverActivity>;

"use client";
import { useEffect, useReducer, useState } from "react";
import { eventActionService } from "@/services";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import type { EventActivity } from "@/types";
export const emptyEventActivity: EventActivity = { goingIds: [], savedIds: [], attendance: [] };
export function useEventActivity() {
  const user = useAuthStore((s) => s.user),
    hydrated = useAuthStore((s) => s.hydrated),
    registrations = useAppStore((s) => s.registrations),
    bookmarks = useAppStore((s) => s.bookmarks);
  const [nonce, refresh] = useReducer((value) => value + 1, 0),
    owner = user ? `${user.id}:${user.email}:${user.role}` : "guest";
  const [remote, setRemote] = useState<{
    owner: string;
    activity: EventActivity;
    error: string;
    loading: boolean;
  }>({ owner: "", activity: emptyEventActivity, error: "", loading: false });
  useEffect(() => {
    if (eventActionService.source === "demo" || !hydrated || !user) return;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setRemote({ owner, activity: emptyEventActivity, error: "", loading: true });
      try {
        const activity = await eventActionService.activity({ signal: controller.signal });
        if (!controller.signal.aborted) setRemote({ owner, activity, error: "", loading: false });
      } catch (error) {
        if (!controller.signal.aborted)
          setRemote({
            owner,
            activity: emptyEventActivity,
            error: error instanceof Error ? error.message : "Your event plans could not load.",
            loading: false,
          });
      }
    });
    return () => controller.abort();
  }, [owner, nonce, hydrated, user]);
  return eventActionService.source === "demo"
    ? {
        ...(user && hydrated
          ? {
              goingIds: registrations,
              savedIds: bookmarks
                .filter((item) => item.entityType === "event")
                .map((item) => item.entityId),
              attendance: [],
            }
          : emptyEventActivity),
        error: "",
        loading: !hydrated,
        refresh,
      }
    : {
        ...(remote.owner === owner && user ? remote.activity : emptyEventActivity),
        error: remote.owner === owner ? remote.error : "",
        loading: !hydrated || (!!user && (remote.owner !== owner || remote.loading)),
        refresh,
      };
}
export type EventActivityState = ReturnType<typeof useEventActivity>;

"use client";
import { useEffect, useReducer, useState } from "react";
import { clubActionService } from "@/services";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import type { ClubActivity } from "@/types";
const empty: ClubActivity = { memberships: [], savedIds: [] };
export function useClubActivity() {
  const user = useAuthStore((s) => s.user),
    hydrated = useAuthStore((s) => s.hydrated);
  const memberships = useAppStore((s) => s.memberships),
    bookmarks = useAppStore((s) => s.bookmarks);
  const [nonce, refresh] = useReducer((value) => value + 1, 0);
  const owner = user ? `${user.id}:${user.email}:${user.role}` : "guest";
  const [remote, setRemote] = useState<{
    owner: string;
    activity: ClubActivity;
    error: string;
    loading: boolean;
  }>({ owner: "", activity: empty, error: "", loading: false });
  useEffect(() => {
    if (clubActionService.source === "demo" || !hydrated || !user) return;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setRemote({ owner, activity: empty, error: "", loading: true });
      try {
        const activity = await clubActionService.activity({ signal: controller.signal });
        if (!controller.signal.aborted) setRemote({ owner, activity, error: "", loading: false });
      } catch (error) {
        if (!controller.signal.aborted)
          setRemote({
            owner,
            activity: empty,
            error: error instanceof Error ? error.message : "Your club activity could not load.",
            loading: false,
          });
      }
    });
    return () => controller.abort();
  }, [owner, nonce, hydrated, user]);
  return clubActionService.source === "demo"
    ? {
        memberships,
        savedIds: bookmarks
          .filter((item) => item.entityType === "club")
          .map((item) => item.entityId),
        error: "",
        loading: !hydrated,
        refresh,
      }
    : {
        ...(remote.owner === owner && user ? remote.activity : empty),
        error: remote.owner === owner ? remote.error : "",
        loading: !!user && (remote.owner !== owner || remote.loading),
        refresh,
      };
}

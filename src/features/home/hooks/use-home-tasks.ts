"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { appConfig } from "@/config/app-config";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { taskService } from "@/services";
import type { TaskItem } from "@/types/productivity";
export function useHomeTasks() {
  const owner = useAuthStore((s) =>
      s.user && s.hydrated && s.source === appConfig.dataSource
        ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
        : "",
    ),
    local = useAppStore((s) => s.tasks),
    [nonce, refresh] = useReducer((n) => n + 1, 0),
    [remote, setRemote] = useState<{
      owner: string;
      items: TaskItem[];
      error: string;
      loading: boolean;
    }>({ owner: "", items: [], error: "", loading: false }),
    [failure, setFailure] = useState({ owner: "", error: "" }),
    controller = useRef<AbortController | null>(null);
  const live = () => {
    const s = useAuthStore.getState();
    return s.user && s.hydrated && s.source === appConfig.dataSource
      ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
      : "";
  };
  useEffect(() => {
    const c = new AbortController();
    if (owner && appConfig.dataSource === "api")
      void Promise.resolve().then(async () => {
        if (c.signal.aborted) return;
        setRemote({ owner, items: [], error: "", loading: true });
        try {
          const result = await taskService.list({ signal: c.signal });
          if (!c.signal.aborted && owner === live())
            setRemote({
              owner,
              items: result.items,
              error: "",
              loading: false,
            });
        } catch (e) {
          if (!c.signal.aborted && owner === live())
            setRemote({
              owner,
              items: [],
              error:
                e instanceof Error
                  ? e.message
                  : "Your task source could not load.",
              loading: false,
            });
        }
      });
    return () => {
      c.abort();
    };
  }, [owner, nonce]);
  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    [owner],
  );
  const update = async (item: TaskItem, completed: boolean) => {
    if (!owner || controller.current) return null;
    const c = new AbortController();
    controller.current = c;
    setFailure({ owner, error: "" });
    try {
      const result = await taskService.put(
        { ...item, completed },
        { signal: c.signal },
      );
      if (c.signal.aborted || owner !== live()) return null;
      refresh();
      return result;
    } catch (e) {
      if (!c.signal.aborted && owner === live())
        setFailure({
          owner,
          error:
            e instanceof Error
              ? e.message
              : "This task update could not finish.",
        });
      return null;
    } finally {
      if (controller.current === c) controller.current = null;
    }
  };
  return {
    owner,
    items: owner
      ? appConfig.dataSource === "demo"
        ? local
        : remote.owner === owner
          ? remote.items
          : []
      : [],
    ready: !!owner,
    loading:
      !!owner &&
      appConfig.dataSource === "api" &&
      (remote.owner !== owner || remote.loading),
    error:
      (failure.owner === owner ? failure.error : "") ||
      (remote.owner === owner ? remote.error : ""),
    update,
    refresh: () => {
      setFailure({ owner, error: "" });
      refresh();
    },
  };
}

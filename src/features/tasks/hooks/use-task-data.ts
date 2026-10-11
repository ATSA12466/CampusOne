"use client";
import { useEffect, useReducer, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { taskService } from "@/services";
import type { TaskItem } from "@/types/productivity";
export function useTaskData() {
  const local = useAppStore((s) => s.tasks),
    [nonce, refresh] = useReducer((n) => n + 1, 0),
    [state, setState] = useState<{
      items: TaskItem[];
      total: number;
      error: string;
      loading: boolean;
    }>({ items: [], total: 0, error: "", loading: true });
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const result = await taskService.list({ signal: controller.signal });
        if (!controller.signal.aborted)
          setState({ ...result, error: "", loading: false });
      } catch (cause) {
        if (!controller.signal.aborted)
          setState({
            items: [],
            total: 0,
            error:
              cause instanceof Error ? cause.message : "Tasks could not load.",
            loading: false,
          });
      }
    });
    return () => controller.abort();
  }, [nonce, local]);
  return { ...state, refresh };
}

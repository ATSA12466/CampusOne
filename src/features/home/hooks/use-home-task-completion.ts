"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { appConfig } from "@/config/app-config";
import type { TaskItem } from "@/types/productivity";
import type { useHomeTasks } from "./use-home-tasks";
export function useHomeTaskCompletion(
  data: Pick<ReturnType<typeof useHomeTasks>, "owner" | "update">,
) {
  const [last, setLast] = useState<{ owner: string; task: TaskItem } | null>(
      null,
    ),
    [saved, setSaved] = useState(true),
    undoRef = useRef<HTMLButtonElement | null>(null),
    toast = useToast();
  const lastCompleted = last?.owner === data.owner ? last.task : null;
  useEffect(() => {
    if (lastCompleted) undoRef.current?.focus({ preventScroll: true });
  }, [lastCompleted]);
  const complete = async (task: TaskItem) => {
    const result = await data.update(task, true);
    if (!result) return;
    setSaved(result.persisted);
    setLast({ owner: data.owner, task });
    toast({
      title:
        appConfig.dataSource === "demo" ? "Demo task updated" : "Task updated",
      description: result.persisted
        ? appConfig.dataSource === "demo"
          ? "Marked complete in your device-only planner."
          : "The connected service accepted this task update."
        : "Only saved for this visit; device storage is unavailable.",
      tone: result.persisted ? "success" : "info",
    });
  };
  const undo = async () => {
    if (!lastCompleted) return;
    const result = await data.update(lastCompleted, false);
    if (!result) return;
    setSaved(result.persisted);
    const target = `home-task-${encodeURIComponent(lastCompleted.id)}`;
    setLast(null);
    requestAnimationFrame(() => document.getElementById(target)?.focus());
  };
  const setUndoRef = useCallback((node: HTMLButtonElement | null) => {
    undoRef.current = node;
  }, []);
  return { lastCompleted, saved, setUndoRef, complete, undo };
}

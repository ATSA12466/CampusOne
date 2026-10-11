"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { discoverActionService } from "@/services";
import { discoverKey } from "@/lib/discover/directory";
import { discoverOwner } from "./use-discover-activity";
import type { DiscoverItem } from "@/types/discover";
export function useDiscoverSave(refresh: () => void) {
  const owner = useAuthStore(
      (state) =>
        `${state.source}:${state.user?.id}:${state.user?.email}:${state.role}`,
    ),
    toast = useToast(),
    controller = useRef<AbortController | null>(null),
    sequence = useRef(0),
    [busy, setBusy] = useState<{
      owner: string;
      key: string;
      goal: boolean;
    } | null>(null),
    [failure, setFailure] = useState<{ owner: string; message: string } | null>(
      null,
    );
  useEffect(
    () => () => {
      sequence.current++;
      controller.current?.abort();
      controller.current = null;
    },
    [owner],
  );
  const save = async (item: DiscoverItem, goal: boolean) => {
    if (controller.current) return;
    const request = new AbortController(),
      current = ++sequence.current;
    controller.current = request;
    setBusy({ owner, key: discoverKey(item), goal });
    setFailure(null);
    try {
      const result = await discoverActionService.save(
        { category: item.category, id: item.id },
        goal,
        { signal: request.signal },
      );
      if (
        request.signal.aborted ||
        owner !== discoverOwner() ||
        current !== sequence.current
      )
        return;
      refresh();
      toast({
        title: goal ? "Saved for a little later" : "Removed from saved items",
        description: !result.persisted
          ? "For this visit only. Device storage is unavailable."
          : discoverActionService.source === "demo"
            ? "Saved with your current local demo profile. No real service was contacted."
            : "The connected service accepted this change.",
        tone: result.persisted ? "success" : "info",
      });
    } catch (cause) {
      if (
        request.signal.aborted ||
        owner !== discoverOwner() ||
        current !== sequence.current
      )
        return;
      const message =
        cause instanceof Error &&
        /chunk|dynamically imported module/i.test(cause.message)
          ? "The save service could not load. Restore your connection, save your work and reload before trying again."
          : cause instanceof Error
            ? cause.message
            : "This save could not finish. Please retry.";
      setFailure({ owner, message });
      toast({
        title: "This save needs another try",
        description: message,
        tone: "danger",
      });
    } finally {
      if (current === sequence.current) {
        controller.current = null;
        setBusy(null);
      }
    }
  };
  return {
    busy: busy?.owner === owner ? busy : null,
    error: failure?.owner === owner ? failure.message : "",
    save,
  };
}
export type DiscoverSaveState = ReturnType<typeof useDiscoverSave>;

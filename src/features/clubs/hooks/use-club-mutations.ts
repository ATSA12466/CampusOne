"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { clubActionService } from "@/services";
import type { ClubMutation } from "@/types";
export function useClubMutations(refresh: () => void) {
  const toast = useToast(),
    owner = useAuthStore((s) => `${s.source}:${s.user?.id}:${s.user?.email}:${s.role}`);
  const controller = useRef<AbortController | null>(null),
    sequence = useRef(0);
  const [busyState, setBusyState] = useState<{ key: string; owner?: string } | null>(null),
    [failure, setFailure] = useState<{ owner: string; message: string } | null>(null);
  useEffect(
    () => () => {
      sequence.current++;
      controller.current?.abort();
      controller.current = null;
    },
    [owner],
  );
  const cancel = () => {
    sequence.current++;
    controller.current?.abort();
    controller.current = null;
    setBusyState(null);
    setFailure(null);
  };
  const run = async (
    key: string,
    action: (signal: AbortSignal) => Promise<ClubMutation>,
    title: string,
  ) => {
    if (controller.current) return false;
    const current = ++sequence.current,
      abort = new AbortController();
    controller.current = abort;
    setBusyState({ key, owner });
    setFailure(null);
    try {
      const result = await action(abort.signal);
      if (abort.signal.aborted || current !== sequence.current) return false;
      refresh();
      toast({
        title,
        description: !result.persisted
          ? "Saved for this visit only. Device storage is unavailable."
          : clubActionService.source === "demo"
            ? "Local demo only. Nothing was sent to a real club."
            : "The connected service accepted this action.",
        tone: result.persisted ? "success" : "info",
      });
      return true;
    } catch (cause) {
      if (abort.signal.aborted || current !== sequence.current) return false;
      const message =
        cause instanceof Error && /chunk|dynamically imported module/i.test(cause.message)
          ? "The club action service could not load. Restore your connection, save your work and reload before trying again."
          : cause instanceof Error
            ? cause.message
            : "This action could not finish. Please try again.";
      setFailure({ owner, message });
      toast({ title: "This action needs another try", description: message, tone: "danger" });
      return false;
    } finally {
      if (current === sequence.current) {
        controller.current = null;
        setBusyState(null);
      }
    }
  };
  return {
    busy: busyState?.owner === owner ? (busyState?.key ?? null) : null,
    error: failure?.owner === owner ? failure.message : "",
    run,
    cancel,
  };
}
export type ClubMutations = ReturnType<typeof useClubMutations>;

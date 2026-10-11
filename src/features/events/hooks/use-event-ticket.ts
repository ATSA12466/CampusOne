"use client";
import { useEffect, useReducer, useState } from "react";
import { eventActionService } from "@/services";
import { useAuthStore } from "@/stores/auth-store";
import type { EventTicket } from "@/types";
export function useEventTicket(id: string) {
  const owner = useAuthStore((s) => `${s.source}:${s.user?.id}:${s.user?.email}:${s.role}`),
    [nonce, retry] = useReducer((value) => value + 1, 0);
  const [state, setState] = useState<{
    owner: string;
    id: string;
    ticket: EventTicket | null;
    loading: boolean;
    error: string;
  }>({ owner: "", id: "", ticket: null, loading: true, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setState({ owner, id, ticket: null, loading: true, error: "" });
      try {
        const ticket = await eventActionService.ticket(id, { signal: controller.signal });
        const live = useAuthStore.getState();
        if (
          !controller.signal.aborted &&
          owner === `${live.source}:${live.user?.id}:${live.user?.email}:${live.role}`
        )
          setState({ owner, id, ticket, loading: false, error: "" });
      } catch (error) {
        if (!controller.signal.aborted)
          setState({
            owner,
            id,
            ticket: null,
            loading: false,
            error: error instanceof Error ? error.message : "Your ticket could not load.",
          });
      }
    });
    return () => controller.abort();
  }, [id, owner, nonce]);
  return {
    ...(state.id === id && state.owner === owner
      ? state
      : { ticket: null, loading: true, error: "" }),
    retry,
  };
}

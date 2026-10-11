"use client";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/auth-store";
import type { EventItem } from "@/types";
import type { EventMutations } from "../hooks/use-event-mutations";
import { RsvpDialog } from "./rsvp-dialog";
import { CancelRsvpDialog } from "./cancel-dialog";
import { TicketDeliveryError } from "./ticket-delivery-error";
export type EventIntent = { event: EventItem; owner: string; kind: "rsvp" | "cancel" | "ticket" };
export const eventOwner = () => {
  const state = useAuthStore.getState();
  return `${state.source}:${state.user?.id}:${state.user?.email}:${state.role}`;
};
const TicketDialog = dynamic(
  () => import("./ticket-dialog").catch(() => ({ default: TicketDeliveryError })),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="text-sm text-muted-foreground">
        Opening your ticket…
      </p>
    ),
  },
);
export function EventDialogs({
  intent,
  action,
  onClose,
}: {
  intent: EventIntent | null;
  action: EventMutations;
  onClose: () => void;
}) {
  const owner = useAuthStore((s) => `${s.source}:${s.user?.id}:${s.user?.email}:${s.role}`);
  if (!intent || intent.owner !== owner) return null;
  return intent.kind === "rsvp" ? (
    <RsvpDialog
      key={`${intent.event.id}:${owner}`}
      event={intent.event}
      action={action}
      onClose={onClose}
    />
  ) : intent.kind === "cancel" ? (
    <CancelRsvpDialog event={intent.event} action={action} onClose={onClose} />
  ) : (
    <TicketDialog event={intent.event} onClose={onClose} />
  );
}

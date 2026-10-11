"use client";
import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { eventActionService } from "@/services";
import { eventDate, eventTime } from "@/lib/events/schedule";
import type { EventItem } from "@/types";
import { useEventTicket } from "../hooks/use-event-ticket";
export default function TicketDialog({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const returnTo = useRef<HTMLElement | null>(
      typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null),
    ),
    state = useEventTicket(event.id),
    demo = eventActionService.source === "demo";
  return (
    <Dialog
      title={demo ? "Your demo ticket preview" : "Your event ticket"}
      description={
        demo
          ? "Not valid for entry. This QR is a fictional interface demonstration, not a real admission credential."
          : "Ticket data is supplied by the connected publisher. Check admission requirements with the organizer."
      }
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      returnFocusRef={returnTo}
      fallbackFocusSelector=".event-detail-actions, #event-directory-title"
    >
      <div className="rounded-media border border-dashed border-control-border p-5 text-center">
        <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
          {demo ? "CampusOne · fictional demo" : "CampusOne · publisher ticket"}
        </p>
        <h3 className="mt-3 font-display text-xl font-semibold">{event.title}</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {eventDate(event)} · {eventTime(event)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{event.venue}</p>
        {state.loading ? (
          <div className="mx-auto mt-5 w-52">
            <Skeleton shape="card" className="aspect-square" />
            <p role="status" className="mt-3 text-xs text-muted-foreground">
              Loading your ticket…
            </p>
          </div>
        ) : state.error ? (
          <ErrorState
            title="Your ticket needs another try."
            description={state.error}
            onRetry={state.retry}
            className="mt-5"
          />
        ) : state.ticket?.status === "revoked" ? (
          <p className="mt-5 rounded-control bg-danger-soft p-4 text-sm text-danger" role="status">
            This ticket has been revoked. It cannot be used for admission.
          </p>
        ) : state.ticket ? (
          <>
            <div className="event-ticket-qr mx-auto mt-5 w-fit rounded-control p-4">
              <QRCodeSVG
                value={state.ticket.payload}
                size={192}
                level="M"
                marginSize={2}
                fgColor="var(--ticket-ink)"
                bgColor="var(--ticket-paper)"
                title={
                  demo ? "Demonstration QR — not valid for entry" : "Publisher-issued ticket QR"
                }
                role="img"
                aria-label={
                  demo ? "Demonstration QR — not valid for entry" : "Publisher-issued ticket QR"
                }
              />
            </div>
            <p className="mt-4 break-all text-xs font-semibold">
              Reference: {state.ticket.reference}
            </p>
          </>
        ) : null}
        {demo ? (
          <p className="mt-5 rounded-control bg-warning-soft p-3 text-xs font-bold text-warning">
            DEMO ONLY · NOT VALID FOR ENTRY
          </p>
        ) : null}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {demo
          ? "No name, email address or student identifier is encoded. Cancelling your demo RSVP removes access to this preview."
          : "Keep your ticket private. This client never invents an admission token; ownership and revocation must be checked by your backend."}
      </p>
    </Dialog>
  );
}

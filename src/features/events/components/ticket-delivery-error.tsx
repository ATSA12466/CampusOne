"use client";
import { useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { EventItem } from "@/types";
export function TicketDeliveryError({ onClose }: { event: EventItem; onClose: () => void }) {
  const returnTo = useRef<HTMLElement | null>(
    typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null),
  );
  return (
    <Dialog
      title="The ticket preview could not load."
      description="The preview code did not arrive. Restore your connection and save any other work before reloading. Your RSVP is not an admission credential."
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      returnFocusRef={returnTo}
      fallbackFocusSelector=".event-detail-actions, #event-directory-title"
    >
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => window.location.reload()}>Reload ticket preview</Button>
        <Button variant="secondary" onClick={onClose}>
          Back to my plan
        </Button>
      </div>
    </Dialog>
  );
}

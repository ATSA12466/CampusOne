import { Dialog } from "@/components/ui/dialog";
import { useRef } from "react";
import { clubActionService } from "@/services";
import type { Club } from "@/types";
import type { ClubMutations } from "../hooks/use-club-mutations";
import { RequestForm } from "./request-form";
export function RequestDialog({
  club,
  onClose,
  action,
}: {
  club: Club | null;
  onClose: () => void;
  action: ClubMutations;
}) {
  const returnTo = useRef<HTMLElement | null>(
    typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null),
  );
  if (!club) return null;
  return (
    <Dialog
      title={`Join ${club.name}`}
      description="A short introduction is a good place to begin. No prior experience needed."
      open
      onOpenChange={(open) => {
        if (!open) {
          action.cancel();
          onClose();
        }
      }}
      returnFocusRef={returnTo}
    >
      <RequestForm
        key={club.id}
        name={club.name}
        pending={action.busy === `request:${club.id}`}
        onSubmit={async (note) => {
          if (
            await action.run(
              `request:${club.id}`,
              (signal) => clubActionService.request(club.id, note, { signal }),
              "Membership request saved",
            )
          )
            onClose();
        }}
        onCancel={() => {
          action.cancel();
          onClose();
        }}
      />
      {action.error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {action.error}
        </p>
      ) : null}
    </Dialog>
  );
}

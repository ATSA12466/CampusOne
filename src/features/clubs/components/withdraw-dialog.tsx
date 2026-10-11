import type { RefObject } from "react";
import { Button } from "@/components/ui";
import { Dialog } from "@/components/ui/dialog";
import { clubActionService } from "@/services";
import type { Club } from "@/types";
import type { ClubMutations } from "../hooks/use-club-mutations";
export function WithdrawDialog({
  open,
  onClose,
  club,
  leaving,
  action,
  returnTo,
}: {
  open: boolean;
  onClose: () => void;
  club: Club;
  leaving: boolean;
  action: ClubMutations;
  returnTo: RefObject<HTMLButtonElement | null>;
}) {
  const close = () => {
    action.cancel();
    onClose();
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) close();
      }}
      title={leaving ? `Leave ${club.name}?` : "Withdraw your request?"}
      description={
        clubActionService.source === "demo"
          ? "This removes the membership from your local demo profile. No real club will be notified."
          : "This asks your connected service to remove your membership or request."
      }
      returnFocusRef={returnTo}
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          disabled={!!action.busy}
          onClick={async () => {
            if (
              await action.run(
                `withdraw:${club.id}`,
                (signal) => clubActionService.withdraw(club.id, { signal }),
                leaving ? "Left the community" : "Membership request withdrawn",
              )
            )
              onClose();
          }}
        >
          {action.busy ? "Updating…" : leaving ? "Leave community" : "Withdraw request"}
        </Button>
        <Button variant="secondary" onClick={close}>
          Keep it
        </Button>
      </div>
      {action.error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {action.error}
        </p>
      ) : null}
    </Dialog>
  );
}

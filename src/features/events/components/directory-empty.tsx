import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { EventFilters } from "@/types";
export function EventDirectoryEmpty({
  view,
  onReset,
}: {
  view: EventFilters["view"];
  onReset: () => void;
}) {
  return (
    <EmptyState
      title={
        view === "going"
          ? "Your next plan starts here."
          : view === "saved"
            ? "A little space for good plans."
            : "No plans found — yet."
      }
      description={
        view === "going"
          ? "RSVP to an event to keep it here. Change the date filter to find past RSVPs."
          : view === "saved"
            ? "Save an event for later, or loosen your search and date filters."
            : "Try another interest, a wider date range or a different search."
      }
      action={
        <Button variant="secondary" onClick={onReset}>
          Reset event filters
        </Button>
      }
    />
  );
}

import { Button } from "@/components/ui";
import { EmptyState } from "@/components/shared/empty-state";
import type { ClubFilters } from "@/types";
export function DirectoryEmpty({
  view,
  onReset,
}: {
  view: ClubFilters["view"];
  onReset: () => void;
}) {
  return (
    <EmptyState
      title={
        view === "saved"
          ? "Your next community is waiting."
          : view === "mine"
            ? "Your story here starts with a hello."
            : "No clubs match this combination."
      }
      description={
        view === "saved"
          ? "Save a club with the bookmark button and find it here."
          : view === "mine"
            ? "A requested or approved membership will appear here."
            : "Try another interest or clear your search."
      }
      action={
        <Button variant="secondary" onClick={onReset}>
          Explore all clubs
        </Button>
      }
    />
  );
}

import { Button } from "@/components/ui";
import type { useClubDirectory } from "../hooks/use-club-directory";
export function LoadMoreClubs({ state }: { state: ReturnType<typeof useClubDirectory> }) {
  return state.catalog.page?.hasMore ? (
    <div className="space-y-2 text-center">
      <p className="text-xs text-muted-foreground">
        Search and filters apply to the {state.clubs.length} loaded clubs of{" "}
        {state.catalog.page.total}.
      </p>
      <Button variant="secondary" disabled={state.more} onClick={() => void state.loadMore()}>
        {state.more ? "Loading more clubs…" : "Load more clubs"}
      </Button>
      {state.moreError ? (
        <p role="alert" className="text-sm text-danger">
          {state.moreError}
        </p>
      ) : null}
    </div>
  ) : null;
}

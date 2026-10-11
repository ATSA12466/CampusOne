import { Button } from "@/components/ui/button";
import type { EventDirectoryState } from "../hooks/use-event-directory";
export function LoadMoreEvents({ state }: { state: EventDirectoryState }) {
  return state.catalog.page?.hasMore ? (
    <div className="space-y-2 text-center">
      <p className="text-xs text-muted-foreground">
        Search, filters and sorting apply to the {state.events.length} loaded events of{" "}
        {state.catalog.page.total}.
      </p>
      <Button variant="secondary" disabled={state.more} onClick={() => void state.loadMore()}>
        {state.more ? "Loading more events…" : "Load more events"}
      </Button>
      {state.moreError ? (
        <p className="text-sm text-danger" role="alert">
          {state.moreError}
        </p>
      ) : null}
    </div>
  ) : null;
}

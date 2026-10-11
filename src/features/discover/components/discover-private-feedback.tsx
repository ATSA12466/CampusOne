import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { discoverActionService } from "@/services";
import type { DiscoverActivityState } from "../hooks/use-discover-activity";
import type { DiscoverSaveState } from "../hooks/use-discover-save";
export function DiscoverPrivateFeedback({
  activity,
  action,
  privateError,
}: {
  activity: DiscoverActivityState;
  action: DiscoverSaveState;
  privateError: boolean;
}) {
  return (
    <>
      {activity.error && !privateError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-control border border-border p-4 text-xs"
        >
          <p className="text-danger">
            Your saved campus items could not load. Saving is unavailable until
            they reconnect.
          </p>
          <Button size="sm" variant="secondary" onClick={activity.refresh}>
            Retry saved items
          </Button>
        </div>
      ) : null}
      {action.error ? (
        <p role="alert" className="text-sm text-danger">
          {action.error}
          {discoverActionService.source === "api"
            ? " An interrupted request may already have reached the service. Refresh saved items to check."
            : ""}
        </p>
      ) : null}
    </>
  );
}
export function DiscoverSaveNotice({
  activity,
  action,
  user,
}: {
  activity: DiscoverActivityState;
  action: DiscoverSaveState;
  user: boolean;
}) {
  return discoverActionService.source === "api" && user ? (
    <p className="text-xs text-muted-foreground">
      Saved state comes from the connected service. Closing or interrupting a
      request cannot undo a write it already accepted.{" "}
      <Button
        size="sm"
        variant="ghost"
        onClick={activity.refresh}
        disabled={activity.loading || !!action.busy}
      >
        Refresh saved items
      </Button>
    </p>
  ) : null;
}

export function DiscoverSavedLoading() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading saved listings"
    >
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className="h-96 rounded-media" />
      ))}
    </div>
  );
}

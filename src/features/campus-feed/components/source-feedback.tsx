"use client";
import { Button } from "@/components/ui";
export function SourceFeedback({
  error,
  more,
  busy,
  count,
  total,
  retry,
  load,
}: {
  error: string | null;
  more: boolean;
  busy: boolean;
  count: number;
  total: number;
  retry: () => void;
  load: () => void;
}) {
  return (
    <div className="rounded-control border border-border bg-surface-muted p-4 text-xs text-muted-foreground">
      {error ? (
        <div role="alert">
          <p>{error} Earlier listings remain available.</p>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={retry}
          >
            Retry source
          </Button>
        </div>
      ) : (
        <p>
          {count} loaded records of {total} reported. Filters and saved views
          cover loaded records only.
        </p>
      )}
      {more ? (
        <Button
          className="mt-3"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={load}
        >
          {busy ? "Loading…" : "Load more records"}
        </Button>
      ) : null}
    </div>
  );
}

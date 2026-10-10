import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SearchCategory } from "@/types/search";
export function SearchStatus({
  count,
  pending,
  error,
  unavailable,
  hasMore,
  onRetry,
}: {
  count: number;
  pending: boolean;
  error?: string;
  unavailable: readonly SearchCategory[];
  hasMore: boolean;
  onRetry: () => void;
}) {
  return (
    <>
      {error || unavailable.length ? (
        <div
          role="alert"
          className="mb-3 flex flex-wrap items-center gap-2 rounded-control bg-warning-soft p-3 text-sm text-warning"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">
            {error
              ? "Search couldn't load. Please retry."
              : "Some campus results couldn't load. Page shortcuts still work."}
          </p>
          <Button variant="ghost" size="sm" onClick={onRetry} className="text-warning">
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : null}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mb-2 px-2 text-xs text-muted-foreground"
      >
        {pending
          ? "Searching…"
          : `${count} ${count === 1 ? "match" : "matches"}${hasMore ? " · more may be available on the full pages" : ""}`}
      </p>
    </>
  );
}

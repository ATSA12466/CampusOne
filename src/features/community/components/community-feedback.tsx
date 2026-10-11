"use client";
import { Button } from "@/components/ui/button";
export function CommunityFeedback({
  publicError,
  onPublicRetry,
  states,
}: {
  publicError: string | null;
  onPublicRetry: () => void;
  states: { error: string; notice: string; refresh: () => void }[];
}) {
  const error = states.find((s) => s.error)?.error,
    notice = states
      .map((s) => s.notice)
      .filter(Boolean)
      .at(-1);
  return (
    <>
      {publicError ? (
        <div role="alert" className="rounded-card border border-border p-4">
          <p>{publicError}</p>
          <Button onClick={onPublicRetry}>Retry community source</Button>
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="rounded-card border border-border p-4">
          <p>{error}</p>
          <Button onClick={() => states.forEach((s) => s.refresh())}>
            Retry private activity
          </Button>
        </div>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-control bg-surface-muted p-3 text-xs"
        >
          {notice}
        </p>
      ) : null}
    </>
  );
}

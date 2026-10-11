import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
export function ActionFeedback({
  pending,
  error,
  onCancel,
}: {
  pending: boolean;
  error: string;
  onCancel: () => void;
}) {
  if (pending)
    return (
      <div
        role="status"
        className="flex flex-wrap items-center gap-2 rounded-control bg-brand-soft p-3 text-sm text-brand"
      >
        <LoaderCircle
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">Working on your request…</span>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel request
        </Button>
      </div>
    );
  return error ? (
    <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">
      {error}
    </p>
  ) : null;
}

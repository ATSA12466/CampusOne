import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
export function OverlayFeedback({
  loading,
  failed,
  onReload,
  onCancel,
}: {
  loading: boolean;
  failed: boolean;
  onReload: () => void;
  onCancel: () => void;
}) {
  if (!loading && !failed) return null;
  return (
    <div
      role={failed ? "alert" : "status"}
      className="fixed top-24 right-4 left-4 z-40 mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-card border border-border bg-surface-raised p-4 text-sm shadow-raised"
    >
      {loading ? (
        <LoaderCircle
          className="size-5 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : null}
      <p className={failed ? "w-full" : "min-w-0 flex-1"}>
        {failed
          ? "This panel couldn't open. Save any changes, then reload the page."
          : "Opening your campus…"}
      </p>
      {failed ? (
        <Button variant="secondary" size="sm" onClick={onReload}>
          Reload page
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

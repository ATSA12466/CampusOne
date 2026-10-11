import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import type { DiscoverFilter } from "@/types/discover";
export function DiscoverEmpty({
  filter,
  guest,
  onReset,
}: {
  filter: DiscoverFilter;
  guest: boolean;
  onReset: () => void;
}) {
  const saved = filter.view === "saved";
  return (
    <EmptyState
      icon={Bookmark}
      title={
        saved && guest
          ? "A profile keeps your finds together."
          : saved
            ? "A little collection, waiting to happen."
            : "Nothing here matches just yet."
      }
      description={
        saved && guest
          ? "Sign in before viewing or saving your campus collection."
          : saved
            ? "Save a few finds with the bookmark button, or clear the filters to see your saved listings."
            : "Try a different keyword or category. Unavailable sources and records not yet loaded are not counted as empty results."
      }
      action={
        saved && guest ? (
          <Button asChild>
            <Link prefetch={false} href="/sign-in?next=%2Fdiscover">
              Sign in to save
            </Link>
          </Button>
        ) : (
          <Button variant="secondary" onClick={onReset}>
            Explore all categories
          </Button>
        )
      }
    />
  );
}

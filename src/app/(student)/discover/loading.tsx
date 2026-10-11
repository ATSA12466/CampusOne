import { Skeleton } from "@/components/ui/skeleton";
export default function DiscoverLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Discover"
      className="mx-auto max-w-6xl space-y-6"
    >
      <Skeleton className="h-[28rem] rounded-media" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-40 rounded-media" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-control" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-96 rounded-media" />
        ))}
      </div>
      <span className="sr-only">Loading campus listings…</span>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" role="status" aria-label="Loading events">
      <Skeleton className="h-[28rem] rounded-media" />
      <Skeleton className="h-16 rounded-control" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((value) => (
          <Skeleton key={value} className="h-80 rounded-media" />
        ))}
      </div>
      <span className="sr-only">Loading campus events…</span>
    </div>
  );
}

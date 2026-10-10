import { MediaCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export function LoadingFeed() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 p-4 md:p-8">
      <div role="status">
        <h1 className="font-display text-2xl font-semibold">Finding your campus…</h1>
        <p className="mt-2 text-sm text-muted-foreground">A few good things are on their way.</p>
      </div>
      <Skeleton className="aspect-[21/9] w-full rounded-media" />
      <div className="grid gap-5 md:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((key) => (
          <MediaCardSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}

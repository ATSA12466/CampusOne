"use client";
import { ReportFilters } from "./components/report-filters";
import { useState } from "react";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui";
import { Pagination } from "@/components/ui/pagination";
import { images } from "@/config/images";
import { useAuthStore } from "@/stores/auth-store";
import { discoverDirectory, discoverKey } from "@/lib/discover/directory";
import { useDiscoverCatalog } from "@/features/discover/hooks/use-discover-catalog";
import { useDiscoverActivity } from "@/features/discover/hooks/use-discover-activity";
import { useDiscoverSave } from "@/features/discover/hooks/use-discover-save";
import { DiscoverSources } from "@/features/discover/components/discover-sources";
import { PhotoRecordBoard } from "@/features/workspace/components/photo-record-board";
import type { DiscoverSnapshot } from "@/types/discover";
import { ReportCard } from "./components/report-card";
export function LostAndFoundFeature({
  initial,
}: {
  initial: DiscoverSnapshot;
}) {
  const catalog = useDiscoverCatalog(initial),
    activity = useDiscoverActivity(),
    action = useDiscoverSave(activity.refresh),
    user = useAuthStore((s) => s.user),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState("all"),
    [view, setView] = useState<"all" | "saved">("all"),
    [page, setPage] = useState(1),
    filter = {
      query,
      category: "lost-found" as const,
      view,
      sort: "date" as const,
      page,
    },
    sections = catalog.sections.map((s) => ({
      ...s,
      page: s.page
        ? {
            ...s.page,
            items: s.page.items.filter(
              (i) =>
                kind === "all" || i.description.toLowerCase().startsWith(kind),
            ),
          }
        : null,
    })),
    result = discoverDirectory(
      sections,
      filter,
      action.busy
        ? (() => {
            const refs = activity.saved.filter(
              (ref) => discoverKey(ref) !== action.busy!.key,
            );
            const item = catalog.sections
              .flatMap((section) => section.page?.items ?? [])
              .find((item) => discoverKey(item) === action.busy!.key);
            return action.busy.goal && item
              ? [...refs, { category: item.category, id: item.id }]
              : refs;
          })()
        : activity.saved,
      new Date(initial.now),
    ),
    saved = new Set(activity.saved.map(discoverKey)),
    available = sections.some((s) => s.page);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <MagazineHeader
        title="A little help finding home."
        description="Lost something? Found something? Leave a careful note."
        eyebrow="Lost & Found"
        image={images.studyCorner}
      />
      <p className="rounded-control bg-warning-soft p-4 text-xs text-warning">
        Fictional public reports. Do not post student ID numbers, sensitive
        document photos or private contacts. Verify claims with a trusted campus
        desk.
      </p>
      <PhotoRecordBoard collection="reports" />
      <section aria-label="Campus reports" className="space-y-5">
        <ReportFilters
          query={query}
          setQuery={setQuery}
          kind={kind}
          setKind={setKind}
          view={view}
          setView={setView}
          setPage={setPage}
        />
        <DiscoverSources catalog={catalog} filter={filter} />
        <h2 className="font-display text-2xl font-semibold">Campus reports.</h2>
        <p role="status" className="text-xs text-muted-foreground">
          {result.total} matching loaded reports
        </p>
        {action.error || activity.error ? (
          <p role="alert" className="text-sm text-danger">
            {action.error || activity.error}
            <Button variant="ghost" onClick={activity.refresh}>
              Retry saved activity
            </Button>
          </p>
        ) : null}
        {!available ? (
          <ErrorState
            title="Reports could not load"
            description="Retry the source above; an unavailable service is not an empty board."
          />
        ) : view === "saved" && activity.error ? (
          <ErrorState
            title="Saved reports unavailable"
            description={activity.error}
            onRetry={activity.refresh}
          />
        ) : view === "saved" && activity.loading ? (
          <p role="status">Loading saved reports…</p>
        ) : !result.total ? (
          <EmptyState
            title="No matching reports"
            description="Try another search or report type; Saved covers loaded records."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((item) => (
              <ReportCard
                key={item.id}
                item={item}
                saved={
                  action.busy?.key === discoverKey(item)
                    ? action.busy.goal
                    : saved.has(discoverKey(item))
                }
                disabled={
                  !user || activity.loading || !!activity.error || !!action.busy
                }
                onSave={() =>
                  void action.save(item, !saved.has(discoverKey(item)))
                }
              />
            ))}
          </div>
        )}
        {result.totalPages > 1 ? (
          <Pagination
            label="Report pages"
            page={result.page}
            totalPages={result.totalPages}
            onPageChange={setPage}
          />
        ) : null}
      </section>
    </div>
  );
}

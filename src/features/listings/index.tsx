"use client";
import { useListingDirectory } from "./hooks/use-listing-directory";
import dynamic from "next/dynamic";
const PhotoRecordBoard = dynamic(() =>
  import("@/features/workspace/components/photo-record-board").then(
    (m) => m.PhotoRecordBoard,
  ),
);
import { CampusClockProvider } from "@/components/providers/campus-clock";
import { ListingIntro } from "./components/listing-intro";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ListingGrid } from "./components/listing-grid";
import { DiscoverSources } from "@/features/discover/components/discover-sources";
import {
  DiscoverPrivateFeedback,
  DiscoverSaveNotice,
} from "@/features/discover/components/discover-private-feedback";
import type { DiscoverSnapshot, DiscoverFilter } from "@/types/discover";
import type { ListingDomain } from "@/types/listings";
import { ListingFilters } from "./components/listing-filters";
function ListingsDirectory({
  domain,
  initial,
  initialFilter,
}: {
  domain: ListingDomain;
  initial: DiscoverSnapshot;
  initialFilter: DiscoverFilter;
}) {
  const {
    catalog,
    activity,
    action,
    user,
    filter,
    change,
    tag,
    setTag,
    config,
    now,
    result,
    tags,
    available,
    privateError,
  } = useListingDirectory(domain, initial, initialFilter);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ListingIntro domain={domain} />
      <section className="space-y-5" aria-label={`${config.label} listings`}>
        <ListingFilters
          filter={filter}
          onChange={change}
          tags={tags}
          tag={tag}
          setTag={setTag}
        />
        <DiscoverSources
          catalog={catalog}
          filter={{ ...filter, category: domain }}
        />
        <h2
          tabIndex={-1}
          id="listing-results"
          className="font-display text-2xl font-semibold"
        >
          {filter.view === "saved"
            ? "Your saved finds."
            : "A few possibilities."}
        </h2>
        <p role="status" className="text-xs text-muted-foreground">
          {result.total} matching loaded listings
        </p>
        <DiscoverPrivateFeedback
          activity={activity}
          action={action}
          privateError={privateError}
        />
        {!available ? (
          <ErrorState
            title="Listings need another moment"
            description="An unavailable catalog is not an empty catalog. Retry the source above."
          />
        ) : privateError ? (
          <ErrorState
            title="Saved finds could not load"
            description={activity.error}
            onRetry={activity.refresh}
          />
        ) : filter.view === "saved" && activity.loading ? (
          <p role="status">Loading saved listings…</p>
        ) : !result.total ? (
          <EmptyState
            title="No matching listings"
            description="Try another filter. Saved views cover only loaded records."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setTag("all");
                  change({ query: "", view: "all", page: 1 });
                }}
              >
                Browse all
              </Button>
            }
          />
        ) : (
          <ListingGrid
            items={result.items}
            action={action}
            activity={activity}
            user={!!user}
            now={now}
          />
        )}
        {result.totalPages > 1 ? (
          <Pagination
            label="Listing result pages"
            page={result.page}
            totalPages={result.totalPages}
            onPageChange={(page) => {
              change({ page });
              document.getElementById("listing-results")?.focus();
            }}
          />
        ) : null}
        <DiscoverSaveNotice activity={activity} action={action} user={!!user} />
      </section>
      {domain === "marketplace" ? (
        <PhotoRecordBoard collection="marketPosts" />
      ) : null}
    </div>
  );
}

export function ListingsFeature(
  props: Parameters<typeof ListingsDirectory>[0],
) {
  return (
    <CampusClockProvider initialNow={props.initial.now}>
      <ListingsDirectory {...props} />
    </CampusClockProvider>
  );
}

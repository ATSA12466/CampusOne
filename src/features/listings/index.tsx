"use client";
import { useState } from "react";
import { ListingIntro } from "./components/listing-intro";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useAuthStore } from "@/stores/auth-store";
import { listingConfig } from "@/config/listings";
import { discoverDirectory } from "@/lib/discover/directory";
import { useDiscoverCatalog } from "@/features/discover/hooks/use-discover-catalog";
import { useDiscoverActivity } from "@/features/discover/hooks/use-discover-activity";
import { useDiscoverSave } from "@/features/discover/hooks/use-discover-save";
import { useDiscoverFilters } from "@/features/discover/hooks/use-discover-filters";
import { ListingGrid } from "./components/listing-grid";
import { DiscoverSources } from "@/features/discover/components/discover-sources";
import {
  DiscoverPrivateFeedback,
  DiscoverSaveNotice,
} from "@/features/discover/components/discover-private-feedback";
import type { DiscoverSnapshot, DiscoverFilter } from "@/types/discover";
import type { ListingDomain } from "@/types/listings";
import { ListingFilters } from "./components/listing-filters";
export function ListingsFeature({
  domain,
  initial,
  initialFilter,
}: {
  domain: ListingDomain;
  initial: DiscoverSnapshot;
  initialFilter: DiscoverFilter;
}) {
  const catalog = useDiscoverCatalog(initial),
    activity = useDiscoverActivity(),
    action = useDiscoverSave(activity.refresh),
    user = useAuthStore((s) => s.user),
    { filter, change } = useDiscoverFilters(initialFilter),
    [tag, setTag] = useState("all"),
    config = listingConfig[domain],
    now = new Date(initial.now);
  const sections = catalog.sections.map((s) => ({
    ...s,
    page: s.page
      ? {
          ...s.page,
          items: s.page.items.filter(
            (i) =>
              tag === "all" ||
              i.facts.some((f) => f.value === tag) ||
              i.description.includes(tag),
          ),
        }
      : null,
  }));
  const result = discoverDirectory(
      sections,
      { ...filter, category: domain },
      activity.saved,
      now,
    ),
    tags = [
      ...new Set(
        catalog.sections.flatMap(
          (s) =>
            s.page?.items.flatMap((i) =>
              i.facts
                .filter(
                  (f) =>
                    !["Listed price", "When", "Deadline", "Reported"].includes(
                      f.label,
                    ),
                )
                .map((f) => f.value),
            ) ?? [],
        ),
      ),
    ].sort(),
    available = catalog.sections.some((s) => s.page),
    privateError = filter.view === "saved" && !!activity.error;
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
    </div>
  );
}

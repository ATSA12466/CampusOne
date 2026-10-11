import { useRef } from "react";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { discoverKey, discoverDirectory } from "@/lib/discover/directory";
import type { DiscoverFilter } from "@/types/discover";
import type { useDiscoverCatalog } from "../hooks/use-discover-catalog";
import type { DiscoverActivityState } from "../hooks/use-discover-activity";
import type { DiscoverSaveState } from "../hooks/use-discover-save";
import { DiscoverFilters } from "./discover-filters";
import { DiscoverSources } from "./discover-sources";
import { DiscoverCard } from "./discover-card";
import { DiscoverEmpty } from "./discover-empty";
import {
  DiscoverPrivateFeedback,
  DiscoverSaveNotice,
  DiscoverSavedLoading,
} from "./discover-private-feedback";
export function DiscoverResults({
  catalog,
  activity,
  action,
  filter,
  change,
  reset,
  user,
  now,
}: {
  catalog: ReturnType<typeof useDiscoverCatalog>;
  activity: DiscoverActivityState;
  action: DiscoverSaveState;
  filter: DiscoverFilter;
  change: (value: Partial<DiscoverFilter>) => void;
  reset: () => void;
  user: boolean;
  now: Date;
}) {
  const heading = useRef<HTMLHeadingElement>(null),
    result = discoverDirectory(catalog.sections, filter, activity.saved, now),
    selected = catalog.sections.filter(
      (section) =>
        filter.category === "all" || section.category === filter.category,
    ),
    available = selected.some((section) => section.page),
    savedKeys = new Set(activity.saved.map(discoverKey)),
    privateLoading = filter.view === "saved" && activity.loading,
    privateError = filter.view === "saved" && !!activity.error;
  const onPage = (page: number) => {
    change({ page });
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
  };
  return (
    <section
      id="discover-directory"
      aria-labelledby="discover-results-title"
      className="scroll-mt-24 space-y-5"
    >
      <DiscoverFilters filter={filter} onChange={change} onReset={reset} />
      <DiscoverSources catalog={catalog} filter={filter} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <h2
          id="discover-results-title"
          ref={heading}
          tabIndex={-1}
          className="scroll-mt-24 font-display text-2xl font-semibold"
        >
          {filter.view === "saved"
            ? "Your saved finds."
            : filter.query.trim()
              ? "A few things worth a look."
              : filter.view === "edit" && filter.category === "all"
                ? "The campus edit."
                : "A little more campus."}
        </h2>
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-muted-foreground"
        >
          {privateLoading
            ? "Loading saved finds…"
            : privateError
              ? "Saved finds unavailable"
              : !available
                ? "Listings unavailable"
                : `${result.total} ${result.total === 1 ? "find" : "finds"}${result.total ? ` · page ${result.page} of ${result.totalPages}` : ""}`}
        </p>
      </div>
      <DiscoverPrivateFeedback
        activity={activity}
        action={action}
        privateError={privateError}
      />
      {privateLoading ? (
        <DiscoverSavedLoading />
      ) : privateError ? (
        <ErrorState
          title="Your saved finds need another moment."
          description={activity.error}
          onRetry={activity.refresh}
        />
      ) : !available ? (
        <ErrorState
          title="This corner of campus needs another moment."
          description="No listings from the selected sources could be loaded. Retry the source above; an unavailable service is not an empty catalog."
        />
      ) : !result.total ? (
        <DiscoverEmpty filter={filter} guest={!user} onReset={reset} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((item) => {
            const key = discoverKey(item),
              busy = action.busy?.key === key,
              saved = busy ? action.busy!.goal : savedKeys.has(key);
            return (
              <DiscoverCard
                key={key}
                item={item}
                now={now}
                saved={saved}
                ready={user && !activity.loading && !activity.error}
                pending={busy}
                disabled={!!action.busy}
                onSave={() => void action.save(item, !saved)}
              />
            );
          })}
        </div>
      )}
      {result.totalPages > 1 &&
      !privateLoading &&
      !privateError &&
      available ? (
        <Pagination
          label="Discover result pages"
          page={result.page}
          totalPages={result.totalPages}
          onPageChange={onPage}
        />
      ) : null}
      <DiscoverSaveNotice activity={activity} action={action} user={user} />
    </section>
  );
}

import { Button } from "@/components/ui/button";
import { discoverLabels } from "@/config/discover";
import type { DiscoverCategory, DiscoverFilter } from "@/types/discover";
import type { useDiscoverCatalog } from "../hooks/use-discover-catalog";
export function DiscoverSources({
  catalog,
  filter,
}: {
  catalog: ReturnType<typeof useDiscoverCatalog>;
  filter: DiscoverFilter;
}) {
  const selected = catalog.sections.filter(
      (section) =>
        filter.category === "all" || section.category === filter.category,
    ),
    unavailable = selected.filter((section) => section.error),
    more = selected.filter((section) => section.page?.hasMore),
    loaded = selected.reduce(
      (total, section) => total + (section.page?.items.length ?? 0),
      0,
    ),
    reported = selected.reduce(
      (total, section) => total + (section.page?.total ?? 0),
      0,
    );
  const read = (category: DiscoverCategory, next = false) =>
    void catalog.read(category, next);
  return (
    <div
      className="space-y-3 rounded-control border border-border bg-surface-muted p-4 text-xs"
      aria-label="Discovery source status"
      aria-busy={!!catalog.pending}
    >
      <p className="leading-relaxed text-muted-foreground">
        {loaded} loaded listings
        {!unavailable.length
          ? ` of ${reported} reported by these sources`
          : ". Some sources are unavailable; the remaining listings are still here"}
        . Search, sorting and saved views cover loaded records only.
      </p>
      {unavailable.map((section) => (
        <div
          key={section.category}
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <p className="min-w-0 text-danger">
            {discoverLabels[section.category]} unavailable. {section.error}
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={!!catalog.pending}
            onClick={() => read(section.category)}
          >
            Retry {discoverLabels[section.category]}
          </Button>
        </div>
      ))}
      {more.length ? (
        <div className="flex flex-wrap gap-2">
          {more.map((section) => (
            <Button
              key={section.category}
              variant="secondary"
              size="sm"
              disabled={!!catalog.pending}
              onClick={() => read(section.category, true)}
            >
              {catalog.pending === section.category
                ? `Loading ${discoverLabels[section.category]}…`
                : `Load more ${discoverLabels[section.category]}`}
            </Button>
          ))}
        </div>
      ) : null}
      {catalog.pending ? (
        <p role="status">
          Loading {discoverLabels[catalog.pending]}… Previously loaded listings
          are still available.
        </p>
      ) : null}
      {catalog.failure &&
      (filter.category === "all" ||
        filter.category === catalog.failure.category) ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 text-danger"
        >
          <p>{catalog.failure.message} Your earlier listings are unchanged.</p>
          <Button
            size="sm"
            variant="secondary"
            disabled={!!catalog.pending}
            onClick={() =>
              read(catalog.failure!.category, catalog.failure!.more)
            }
          >
            Retry loading {discoverLabels[catalog.failure.category]}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

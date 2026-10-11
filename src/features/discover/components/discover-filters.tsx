import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { discoverCategories, discoverLabels } from "@/config/discover";
import type { DiscoverFilter } from "@/types/discover";
export function DiscoverFilters({
  filter,
  onChange,
  onReset,
}: {
  filter: DiscoverFilter;
  onChange: (value: Partial<DiscoverFilter>) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <SegmentedControl
        label="Discover collection"
        value={filter.view}
        options={[
          { value: "edit", label: "Campus edit" },
          { value: "all", label: "Browse all" },
          { value: "saved", label: "Saved" },
        ]}
        onValueChange={(view) =>
          onChange({ view: view as DiscoverFilter["view"] })
        }
        className="flex w-full sm:w-fit"
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_200px_180px_auto]">
        <label className="block text-xs font-semibold">
          Search across campus
          <span className="relative mt-2 block">
            <Search
              className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={filter.query}
              maxLength={120}
              onChange={(event) => onChange({ query: event.target.value })}
              placeholder="Try robotics, a course or a place…"
              className="pl-9"
              type="search"
            />
          </span>
        </label>
        <label className="block text-xs font-semibold">
          A corner of campus
          <select
            aria-label="Filter discovery category"
            className="field-control mt-2 px-3"
            value={filter.category}
            onChange={(event) =>
              onChange({
                category: event.target.value as DiscoverFilter["category"],
              })
            }
          >
            <option value="all">All categories</option>
            {discoverCategories.map((category) => (
              <option key={category} value={category}>
                {discoverLabels[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold">
          Sort your finds
          <select
            aria-label="Sort discovery results"
            className="field-control mt-2 px-3"
            value={filter.sort}
            onChange={(event) =>
              onChange({ sort: event.target.value as DiscoverFilter["sort"] })
            }
          >
            <option value="mix">Balanced mix</option>
            <option value="name">Title A–Z</option>
            <option value="date">Latest supplied date</option>
          </select>
        </label>
        <Button variant="ghost" onClick={onReset} className="self-end">
          Reset filters
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        The campus edit is a balanced mix of up to 24 listings, not a
        personalized or popularity ranking. Search and categories explore all
        loaded listings. Date sort uses supplied event, deadline or publication
        dates; undated items come last.
      </p>
    </div>
  );
}

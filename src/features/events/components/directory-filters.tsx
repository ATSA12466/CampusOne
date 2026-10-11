import { SearchInput } from "@/components/shared/search-input";
import { Button, Checkbox, Select } from "@/components/ui";
import type { EventFilters } from "@/types";
const views: { value: EventFilters["view"]; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "going", label: "My RSVPs" },
  { value: "saved", label: "Saved events" },
];
export function EventDirectoryFilters({
  filter,
  categories,
  onChange,
}: {
  filter: EventFilters;
  categories: string[];
  onChange: (value: Partial<EventFilters>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Event collection">
        {views.map((item) => (
          <Button
            key={item.value}
            variant={filter.view === item.value ? "primary" : "secondary"}
            aria-pressed={filter.view === item.value}
            onClick={() => onChange({ view: item.value })}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px]">
        <SearchInput
          value={filter.query}
          onChange={(query) => onChange({ query })}
          placeholder="Search events"
        />
        <Select
          aria-label="When to explore"
          value={filter.time}
          onChange={(event) => onChange({ time: event.target.value as EventFilters["time"] })}
        >
          <option value="upcoming">Today &amp; later</option>
          <option value="week">Next 7 days</option>
          <option value="month">Next 30 days</option>
          <option value="past">Past events</option>
          <option value="all">Any date</option>
        </Select>
        <Select
          aria-label="Sort events"
          value={filter.sort}
          onChange={(event) => onChange({ sort: event.target.value as EventFilters["sort"] })}
        >
          <option value="soon">Soonest first</option>
          <option value="name">Name: A to Z</option>
          <option value="popular">Most RSVPs</option>
          <option value="price">Price: low to high</option>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter events by category">
        {["all", ...categories].map((category) => (
          <Button
            key={category}
            size="sm"
            variant={filter.category === category ? "primary" : "ghost"}
            aria-pressed={filter.category === category}
            onClick={() => onChange({ category })}
          >
            {category === "all" ? "All interests" : category}
          </Button>
        ))}
      </div>
      <Checkbox
        label="Free events only"
        checked={filter.freeOnly}
        onCheckedChange={(value) => onChange({ freeOnly: value === true })}
      />
    </div>
  );
}

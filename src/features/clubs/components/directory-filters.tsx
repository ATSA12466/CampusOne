import { SearchInput } from "@/components/shared/search-input";
import { Button, Select } from "@/components/ui";
import type { ClubFilters } from "@/types";
export function DirectoryFilters({
  filter,
  categories,
  onChange,
}: {
  filter: ClubFilters;
  categories: string[];
  onChange: (value: Partial<ClubFilters>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Club collection">
        {[
          { value: "all", label: "All clubs" },
          { value: "mine", label: "My communities" },
          { value: "saved", label: "Saved clubs" },
        ].map((item) => (
          <Button
            key={item.value}
            variant={filter.view === item.value ? "primary" : "secondary"}
            aria-pressed={filter.view === item.value}
            onClick={() => onChange({ view: item.value as ClubFilters["view"] })}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <SearchInput
          value={filter.query}
          onChange={(query) => onChange({ query })}
          placeholder="Search clubs"
        />
        <Select
          aria-label="Sort clubs"
          value={filter.sort}
          onChange={(event) => onChange({ sort: event.target.value as ClubFilters["sort"] })}
        >
          <option value="recommended">Featured first</option>
          <option value="name">Name: A to Z</option>
          <option value="members">Most members</option>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter clubs by category">
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
    </div>
  );
}

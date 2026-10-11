import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { DiscoverFilter } from "@/types/discover";
export function ListingFilters({
  filter,
  onChange,
  tags,
  tag,
  setTag,
}: {
  filter: DiscoverFilter;
  onChange: (v: Partial<DiscoverFilter>) => void;
  tags: string[];
  tag: string;
  setTag: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <SegmentedControl
        label="Listing views"
        value={filter.view}
        onValueChange={(v) =>
          onChange({ view: v === "saved" ? "saved" : "all" })
        }
        options={[
          { value: "all", label: "Browse all" },
          { value: "saved", label: "Saved" },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_180px_180px_auto]">
        <label className="text-xs font-medium">
          Search listings
          <Input
            type="search"
            value={filter.query}
            maxLength={120}
            placeholder="A place, course or useful find…"
            onChange={(e) => onChange({ query: e.target.value })}
          />
        </label>
        <label className="text-xs font-medium">
          Filter listings
          <Select
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              onChange({ page: 1 });
            }}
          >
            <option value="all">All types & facilities</option>
            {tags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </label>
        <label className="text-xs font-medium">
          Sort listings
          <Select
            value={filter.sort}
            onChange={(e) =>
              onChange({
                sort:
                  e.target.value === "date"
                    ? "date"
                    : e.target.value === "name"
                      ? "name"
                      : "mix",
              })
            }
          >
            <option value="mix">Campus edit order</option>
            <option value="name">Title A–Z</option>
            <option value="date">Latest supplied date</option>
          </Select>
        </label>
        <Button
          variant="ghost"
          className="self-end"
          onClick={() => {
            setTag("all");
            onChange({ query: "", view: "all", sort: "mix", page: 1 });
          }}
        >
          Reset filters
        </Button>
      </div>
    </div>
  );
}

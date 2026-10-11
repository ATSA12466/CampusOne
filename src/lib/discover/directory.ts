import {
  discoverCategories,
  discoverEditSize,
  discoverLabels,
  discoverPageSize,
} from "@/config/discover";
import { normalizeSearch } from "@/lib/search/rank";
import { discoverStatus } from "./status";
import type {
  DiscoverFilter,
  DiscoverItem,
  DiscoverReference,
  DiscoverSection,
} from "@/types/discover";
export const discoverKey = (item: DiscoverReference) =>
  `${item.category}:${item.id}`;
export function mixedDiscoverItems(items: readonly DiscoverItem[]) {
  const groups = discoverCategories.map((category) =>
    items
      .filter((item) => item.category === category)
      .sort(
        (a, b) =>
          (a.rank ?? 100000) - (b.rank ?? 100000) ||
          a.title.localeCompare(b.title, "en-GH") ||
          a.id.localeCompare(b.id),
      ),
  );
  const result: DiscoverItem[] = [];
  for (let index = 0; groups.some((group) => index < group.length); index++)
    for (const group of groups) if (group[index]) result.push(group[index]);
  return result;
}
export function discoverDirectory(
  sections: readonly DiscoverSection[],
  filter: DiscoverFilter,
  saved: readonly DiscoverReference[],
  now: Date,
) {
  const all = [
      ...new Map(
        sections
          .flatMap((section) => section.page?.items ?? [])
          .map((item) => [discoverKey(item), item]),
      ).values(),
    ],
    savedKeys = new Set(saved.map(discoverKey)),
    term = normalizeSearch(filter.query.trim());
  let selected = mixedDiscoverItems(all);
  if (filter.view === "saved")
    selected = selected.filter((item) => savedKeys.has(discoverKey(item)));
  // Search/category exploration expands beyond the edit, but never beyond actually loaded records.
  if (filter.view === "edit" && filter.category === "all" && !term)
    selected = selected
      .filter(
        (item) =>
          !["Event ended", "Cancelled", "Deadline passed"].includes(
            discoverStatus(item, now),
          ),
      )
      .slice(0, discoverEditSize);
  selected = selected.filter(
    (item) =>
      (filter.category === "all" || item.category === filter.category) &&
      normalizeSearch(
        `${item.title} ${item.description} ${discoverLabels[item.category]} ${item.facts.map((fact) => fact.value).join(" ")}`,
      ).includes(term),
  );
  if (filter.sort === "name")
    selected.sort(
      (a, b) =>
        a.title.localeCompare(b.title, "en-GH") ||
        discoverKey(a).localeCompare(discoverKey(b)),
    );
  if (filter.sort === "date")
    selected.sort(
      (a, b) =>
        (b.date ?? "").localeCompare(a.date ?? "") ||
        a.title.localeCompare(b.title, "en-GH") ||
        discoverKey(a).localeCompare(discoverKey(b)),
    );
  const totalPages = Math.max(1, Math.ceil(selected.length / discoverPageSize)),
    requested = Number.isFinite(filter.page) ? Math.floor(filter.page) : 1,
    page = Math.max(1, Math.min(totalPages, requested));
  return {
    items: selected.slice(
      (page - 1) * discoverPageSize,
      page * discoverPageSize,
    ),
    total: selected.length,
    totalPages,
    page,
    loaded: all.length,
  };
}

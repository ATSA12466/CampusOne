import { clubCategoryLabel } from "./category";
import type { Club, ClubFilters, ClubMembership } from "@/types";
export const clubPageSize = 6;
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-GH");
export function clubDirectory(
  clubs: readonly Club[],
  filter: ClubFilters,
  activity: {
    memberships: readonly ClubMembership[];
    savedIds: readonly string[];
    userId?: string;
  },
) {
  const query = fold(filter.query.trim());
  const items = clubs
    .filter((club) => {
      const search = fold(
        [
          club.name,
          club.category,
          clubCategoryLabel(club.category),
          club.description,
          ...club.objectives,
          club.details?.venue ?? "",
          club.details?.meeting ?? "",
        ].join(" "),
      );
      return (
        search.includes(query) &&
        (filter.category === "all" ||
          club.category === filter.category ||
          clubCategoryLabel(club.category) === filter.category) &&
        (filter.view !== "saved" || activity.savedIds.includes(club.id)) &&
        (filter.view !== "mine" ||
          activity.memberships.some(
            (item) =>
              item.clubId === club.id &&
              item.userId === activity.userId &&
              item.status !== "rejected",
          ))
      );
    })
    .sort((a, b) =>
      filter.sort === "members"
        ? (b.details?.memberCount ?? -1) - (a.details?.memberCount ?? -1) ||
          a.name.localeCompare(b.name)
        : filter.sort === "name"
          ? a.name.localeCompare(b.name, "en-GH")
          : (a.details?.rank ?? 100000) - (b.details?.rank ?? 100000) ||
            a.name.localeCompare(b.name),
    );
  const totalPages = Math.max(1, Math.ceil(items.length / clubPageSize));
  const page = Math.max(1, Math.min(totalPages, Number.isInteger(filter.page) ? filter.page : 1));
  return {
    items: items.slice((page - 1) * clubPageSize, page * clubPageSize),
    total: items.length,
    totalPages,
    page,
  };
}

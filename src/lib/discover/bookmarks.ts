import { discoverBookmarkTypes, discoverCategories } from "@/config/discover";
import type { DiscoverReference } from "@/types/discover";
import type { Bookmark } from "@/types/common";
export function discoverSavedFromBookmarks(
  bookmarks: readonly Bookmark[],
): DiscoverReference[] {
  if (!Array.isArray(bookmarks)) return [];
  const records: readonly Bookmark[] = bookmarks;
  return discoverCategories.flatMap((category) =>
    records
      .filter(
        (bookmark) =>
          bookmark?.entityType === discoverBookmarkTypes[category] &&
          typeof bookmark.entityId === "string",
      )
      .map((bookmark) => ({ category, id: bookmark.entityId })),
  );
}

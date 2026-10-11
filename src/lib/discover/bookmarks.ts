import { discoverBookmarkTypes, discoverCategories } from "@/config/discover";
import type { Bookmark } from "@/types/common";
export function discoverSavedFromBookmarks(bookmarks: readonly Bookmark[]) {
  if (!Array.isArray(bookmarks)) return [];
  return discoverCategories.flatMap((category) =>
    bookmarks
      .filter(
        (bookmark) =>
          bookmark?.entityType === discoverBookmarkTypes[category] &&
          typeof bookmark.entityId === "string",
      )
      .map((bookmark) => ({ category, id: bookmark.entityId })),
  );
}

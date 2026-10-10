import type { SearchResult } from "@/types/search";
export const normalizeSearch = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en-GH");
export function rankSearchResults(items: readonly SearchResult[], query: string) {
  const term = normalizeSearch(query);
  const score = (item: SearchResult) => {
    const title = normalizeSearch(item.title);
    return title === term ? 4 : title.startsWith(term) ? 3 : title.includes(term) ? 2 : 1;
  };
  return [...items].sort((a, b) => score(b) - score(a) || a.title.localeCompare(b.title, "en-GH"));
}

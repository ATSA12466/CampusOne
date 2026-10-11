"use client";
import { useEffect, useRef, useState } from "react";
import { clubCatalogService } from "@/services";
import { clubCategoryLabel } from "@/lib/clubs/category";
import { clubDirectory } from "@/lib/clubs/directory";
import type { ClubCatalog, ClubFilters } from "@/types";
import type { useClubActivity } from "./use-club-activity";
export function useClubDirectory(
  initial: ClubCatalog,
  activity: ReturnType<typeof useClubActivity>,
  userId?: string,
) {
  const [catalog, setCatalog] = useState(initial),
    [more, setMore] = useState(false),
    [moreError, setMoreError] = useState("");
  const [filter, setFilter] = useState<ClubFilters>({
    query: "",
    category: "all",
    sort: "recommended",
    view: "all",
    page: 1,
  });
  const resultsRef = useRef<HTMLHeadingElement>(null),
    request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const clubs = catalog.page?.items ?? [],
    categories = [...new Set(clubs.map((club) => clubCategoryLabel(club.category)))].sort();
  const results = clubDirectory(clubs, filter, { ...activity, userId });
  const change = (value: Partial<ClubFilters>) =>
    setFilter((current) => ({ ...current, ...value, page: value.page ?? 1 }));
  const reset = () =>
    setFilter({ query: "", category: "all", sort: "recommended", view: "all", page: 1 });
  const loadMore = async () => {
    if (!catalog.page || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setMore(true);
    setMoreError("");
    try {
      const next = await clubCatalogService.list(catalog.page.page + 1, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (next.page)
        setCatalog({
          error: null,
          page: {
            ...next.page,
            items: [
              ...new Map([...clubs, ...next.page.items].map((club) => [club.id, club])).values(),
            ],
          },
        });
      else setMoreError(next.error ?? "More clubs could not load.");
    } catch (error) {
      if (!controller.signal.aborted)
        setMoreError(error instanceof Error ? error.message : "More clubs could not load.");
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setMore(false);
      }
    }
  };
  return {
    catalog,
    more,
    moreError,
    filter,
    resultsRef,
    clubs,
    categories,
    results,
    change,
    reset,
    loadMore,
  };
}

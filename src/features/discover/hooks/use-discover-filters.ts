"use client";
import { useEffect, useState } from "react";
import { discoverDefaults } from "@/config/discover";
import {
  filterFromParams,
  filterParams,
  discoverFilterSchema,
} from "../validation/filter.schema";
import type { DiscoverFilter } from "@/types/discover";
export function useDiscoverFilters(initial: DiscoverFilter) {
  const [filter, setFilter] = useState(initial);
  useEffect(() => {
    const restore = () =>
      setFilter(filterFromParams(new URLSearchParams(location.search)));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const change = (update: Partial<DiscoverFilter>) => {
    const next = discoverFilterSchema.parse({
      ...filter,
      ...update,
      page: update.page ?? 1,
    });
    setFilter(next);
    const url = new URL(location.href),
      params = filterParams(next);
    url.search = params.toString();
    if ("query" in update) history.replaceState(null, "", url);
    else history.pushState(null, "", url);
  };
  return { filter, change, reset: () => change({ ...discoverDefaults }) };
}

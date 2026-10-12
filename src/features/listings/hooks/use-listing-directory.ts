"use client";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { listingConfig } from "@/config/listings";
import { discoverDirectory } from "@/lib/discover/directory";
import { useCampusClock } from "@/components/providers/campus-clock";
import { useDiscoverCatalog } from "@/features/discover/hooks/use-discover-catalog";
import { useDiscoverActivity } from "@/features/discover/hooks/use-discover-activity";
import { useDiscoverSave } from "@/features/discover/hooks/use-discover-save";
import { useDiscoverFilters } from "@/features/discover/hooks/use-discover-filters";
import type { DiscoverSnapshot, DiscoverFilter } from "@/types/discover";
import type { ListingDomain } from "@/types/listings";
export function useListingDirectory(
  domain: ListingDomain,
  initial: DiscoverSnapshot,
  initialFilter: DiscoverFilter,
) {
  const catalog = useDiscoverCatalog(initial),
    activity = useDiscoverActivity(),
    action = useDiscoverSave(activity.refresh),
    user = useAuthStore((s) => s.user),
    { filter, change } = useDiscoverFilters(initialFilter),
    [tag, setTag] = useState("all"),
    config = listingConfig[domain],
    now = useCampusClock();
  const sections = catalog.sections.map((s) => ({
    ...s,
    page: s.page
      ? {
          ...s.page,
          items: s.page.items.filter(
            (i) =>
              tag === "all" ||
              i.facts.some((f) => f.value === tag) ||
              i.description.includes(tag),
          ),
        }
      : null,
  }));
  const result = discoverDirectory(
      sections,
      { ...filter, category: domain },
      activity.saved,
      now,
    ),
    tags = [
      ...new Set(
        catalog.sections.flatMap(
          (s) =>
            s.page?.items.flatMap((i) =>
              i.facts
                .filter(
                  (f) =>
                    !["Listed price", "When", "Deadline", "Reported"].includes(
                      f.label,
                    ),
                )
                .map((f) => f.value),
            ) ?? [],
        ),
      ),
    ].sort(),
    available = catalog.sections.some((s) => s.page),
    privateError = filter.view === "saved" && !!activity.error;
  return {
    catalog,
    activity,
    action,
    user,
    filter,
    change,
    tag,
    setTag,
    config,
    now,
    result,
    tags,
    available,
    privateError,
  };
}

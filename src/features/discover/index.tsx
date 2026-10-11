"use client";
import { useAuthStore } from "@/stores/auth-store";
import { appConfig } from "@/config/app-config";
import {
  CampusClockProvider,
  useCampusClock,
} from "@/components/providers/campus-clock";
import type { DiscoverSnapshot, DiscoverFilter } from "@/types/discover";
import { useDiscoverCatalog } from "./hooks/use-discover-catalog";
import { useDiscoverFilters } from "./hooks/use-discover-filters";
import { useDiscoverActivity } from "./hooks/use-discover-activity";
import { useDiscoverSave } from "./hooks/use-discover-save";
import { DiscoverHero } from "./components/discover-hero";
import { DiscoverCollections } from "./components/discover-collections";
import { DiscoverResults } from "./components/discover-results";
export function DiscoverFeature({
  initial,
  filter,
}: {
  initial: DiscoverSnapshot;
  filter: DiscoverFilter;
}) {
  return (
    <CampusClockProvider initialNow={initial.now}>
      <DiscoverDirectory initial={initial} initialFilter={filter} />
    </CampusClockProvider>
  );
}
function DiscoverDirectory({
  initial,
  initialFilter,
}: {
  initial: DiscoverSnapshot;
  initialFilter: DiscoverFilter;
}) {
  const user = useAuthStore((state) => state.user),
    now = useCampusClock(),
    catalog = useDiscoverCatalog(initial),
    { filter, change, reset } = useDiscoverFilters(initialFilter),
    activity = useDiscoverActivity(),
    action = useDiscoverSave(activity.refresh);
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-6">
      <DiscoverHero />
      <DiscoverCollections />
      {appConfig.dataSource === "demo" ? (
        <p className="rounded-control border border-border bg-surface-muted p-4 text-xs leading-relaxed text-muted-foreground">
          Fictional demo campus · All listings, prices, people and venues are
          illustrative, not verified university services or real offers. Saved
          items stay with the current local profile on this device. Category
          illustrations are not photographs of the listed property, product,
          report or recording.
        </p>
      ) : null}
      <DiscoverResults
        catalog={catalog}
        activity={activity}
        action={action}
        filter={filter}
        change={change}
        reset={reset}
        user={!!user}
        now={now}
      />
    </div>
  );
}

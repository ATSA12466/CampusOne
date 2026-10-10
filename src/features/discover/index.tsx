"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Card } from "@/components/ui";
import { academicsService, engagementService, lifeService, mediaService } from "@/services";

interface DiscoverResult {
  id: string;
  title: string;
  category: string;
  href: string;
}

const categoryFilters = [
  "all",
  "resources",
  "clubs",
  "events",
  "opportunities",
  "accommodation",
  "lost-found",
  "marketplace",
  "media",
];

export function DiscoverFeature() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const allResults = useMemo<DiscoverResult[]>(() => {
    const resources = academicsService.listResources().map((resource) => ({
      id: resource.id,
      title: resource.title,
      category: "resources",
      href: `/academics/resources/${resource.id}`,
    }));
    const clubs = engagementService
      .listClubs()
      .map((club) => ({
        id: club.id,
        title: club.name,
        category: "clubs",
        href: `/clubs/${club.id}`,
      }));
    const events = engagementService
      .listEvents()
      .map((event) => ({
        id: event.id,
        title: event.title,
        category: "events",
        href: `/events/${event.id}`,
      }));
    const opportunities = engagementService
      .listOpportunities()
      .map((opportunity) => ({
        id: opportunity.id,
        title: opportunity.title,
        category: "opportunities",
        href: `/opportunities/${opportunity.id}`,
      }));
    const accommodation = lifeService
      .listAccommodation()
      .map((item) => ({
        id: item.id,
        title: item.title,
        category: "accommodation",
        href: `/accommodation/${item.id}`,
      }));
    const reports = lifeService
      .listLostFound()
      .map((item) => ({
        id: item.id,
        title: item.item,
        category: "lost-found",
        href: "/lost-and-found",
      }));
    const market = lifeService
      .listMarketplace()
      .map((item) => ({
        id: item.id,
        title: item.title,
        category: "marketplace",
        href: `/marketplace/${item.id}`,
      }));
    const media = mediaService
      .listMedia()
      .map((item) => ({ id: item.id, title: item.title, category: "media", href: "/media" }));
    return [
      ...resources,
      ...clubs,
      ...events,
      ...opportunities,
      ...accommodation,
      ...reports,
      ...market,
      ...media,
    ];
  }, []);

  const filtered = allResults.filter((item) => {
    const categoryMatch = category === "all" || item.category === category;
    const queryMatch = item.title.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && queryMatch;
  });

  return (
    <div>
      <PageHeader
        title="Discover"
        description="Search across resources, clubs, events, opportunities, accommodation, and media."
      />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <SearchInput value={query} onChange={setQuery} placeholder="Search CampusOne" />
        <select
          aria-label="Filter discovery category"
          className="field-control px-3"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categoryFilters.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <Link key={`${item.category}-${item.id}`} href={item.href}>
              <Card className="h-full p-4 transition hover:border-brand/25 hover:bg-brand-soft">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.category}
                </p>
                <p className="mt-1 font-semibold text-foreground">{item.title}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No results found" description="Try a different keyword or category." />
      )}
    </div>
  );
}

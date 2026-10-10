"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button, Card } from "@/components/ui";
import { engagementService } from "@/services";
import { useAppStore } from "@/stores/app-store";

export function OpportunitiesFeature() {
  const [query, setQuery] = useState("");
  const opportunities = engagementService
    .listOpportunities()
    .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
  const bookmarks = useAppStore((state) => state.bookmarks);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Opportunities"
        description="Internships, scholarships, competitions, and training pathways."
      />
      <SearchInput value={query} onChange={setQuery} placeholder="Search opportunities" />
      <div className="grid gap-3 md:grid-cols-2">
        {opportunities.map((opportunity) => {
          const saved = bookmarks.some(
            (item) => item.entityId === opportunity.id && item.entityType === "opportunity",
          );
          return (
            <Card key={opportunity.id}>
              <h3 className="font-semibold">{opportunity.title}</h3>
              <p className="text-sm text-muted-foreground">{opportunity.provider}</p>
              <p className="mt-2 text-sm text-foreground">{opportunity.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">Deadline: {opportunity.deadline}</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/opportunities/${opportunity.id}`}>
                  <Button size="sm" variant="secondary">
                    Details
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    toggleBookmark({
                      id: `b-${opportunity.id}`,
                      entityId: opportunity.id,
                      entityType: "opportunity",
                    })
                  }
                >
                  {saved ? "Unsave" : "Save"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Select } from "@/components/ui";
import { engagementService } from "@/services";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { ClubCard } from "./components/club-card";
import { ExecutiveRequestsPanel } from "./components/executive-requests-panel";

export function ClubsFeature() {
  const clubs = engagementService.listClubs();
  const memberships = useAppStore((state) => state.memberships);
  const requestMembership = useAppStore((state) => state.requestMembership);
  const reviewMembership = useAppStore((state) => state.reviewMembership);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...new Set(clubs.map((club) => club.category))],
    [clubs],
  );

  const filteredClubs = clubs.filter((club) => {
    const queryMatch = club.name.toLowerCase().includes(query.toLowerCase());
    const categoryMatch = category === "all" || club.category === category;
    return queryMatch && categoryMatch;
  });

  const pendingRequests = memberships.filter((membership) => membership.status === "pending");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clubs & Participation"
        description="Discover clubs, request membership, and track participation."
      />
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <SearchInput value={query} onChange={setQuery} placeholder="Search clubs" />
        <Select
          aria-label="Filter clubs by category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {filteredClubs.map((club) => {
          const membership = memberships.find(
            (item) => item.clubId === club.id && item.userId === user?.id,
          );
          return (
            <ClubCard
              key={club.id}
              club={club}
              membership={membership}
              canRequest={!membership && !!user}
              onRequestJoin={() => {
                if (!user) return;
                requestMembership(club.id, user.id);
              }}
            />
          );
        })}
      </div>
      {role === "club-executive" ? (
        <ExecutiveRequestsPanel
          pendingRequests={pendingRequests}
          clubs={clubs}
          onReview={reviewMembership}
        />
      ) : null}
    </div>
  );
}

"use client";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tabs } from "@/components/ui/tabs";
export function ChoicePreview() {
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("week");
  const [tab, setTab] = useState("overview");
  return (
    <Card padding="lg" className="space-y-6">
      <FilterBar
        label="Preview content filters"
        value={filter}
        onValueChange={setFilter}
        options={[
          { value: "all", label: "Everything" },
          { value: "clubs", label: "Clubs" },
          { value: "events", label: "Events" },
          {
            value: "saved",
            label: "Saved",
            icon: <Bookmark className="size-4" aria-hidden="true" />,
          },
        ]}
      />
      <p className="text-xs text-muted-foreground" role="status">
        Showing {filter === "all" ? "everything" : filter} · component preview
      </p>
      <SegmentedControl
        label="Calendar view preview"
        value={view}
        onValueChange={setView}
        options={[
          { value: "day", label: "Day" },
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
        ]}
      />
      <Tabs
        label="Club preview sections"
        value={tab}
        onValueChange={setTab}
        tabs={[
          {
            value: "overview",
            label: "Overview",
            content: (
              <p className="text-sm text-muted-foreground">
                A curious community for people who love building things.
              </p>
            ),
          },
          {
            value: "events",
            label: "Events",
            content: (
              <p className="text-sm text-muted-foreground">
                Friday code circles. Saturday project sessions.
              </p>
            ),
          },
          {
            value: "members",
            label: "Members",
            content: (
              <p className="text-sm text-muted-foreground">
                128 students, plenty of possibilities.
              </p>
            ),
          },
        ]}
      />
    </Card>
  );
}

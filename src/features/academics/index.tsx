"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge, Button, Card, Select } from "@/components/ui";
import { academicsService } from "@/services";
import { useAppStore } from "@/stores/app-store";

export function AcademicsFeature() {
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("all");
  const resources = academicsService.listResources();
  const courses = academicsService.listCourses();
  const bookmarks = useAppStore((state) => state.bookmarks);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  const filtered = useMemo(
    () =>
      resources.filter((resource) => {
        const queryMatch = resource.title.toLowerCase().includes(query.toLowerCase());
        const courseMatch = course === "all" || resource.course === course;
        return queryMatch && courseMatch;
      }),
    [course, query, resources],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Academic resources"
        description="Course materials, revision guides, and learning assets."
      />
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <SearchInput value={query} onChange={setQuery} placeholder="Search resources" />
        <Select
          aria-label="Filter by course"
          value={course}
          onChange={(event) => setCourse(event.target.value)}
        >
          <option value="all">All courses</option>
          {courses.map((item) => (
            <option key={item.id} value={item.code}>
              {item.code}
            </option>
          ))}
        </Select>
      </div>
      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((resource) => {
            const saved = bookmarks.some(
              (item) => item.entityId === resource.id && item.entityType === "resource",
            );
            return (
              <Card key={resource.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">{resource.course}</p>
                  </div>
                  <Badge tone="primary">{resource.category}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/academics/resources/${resource.id}`}>
                    <Button size="sm" variant="secondary">
                      View details
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      toggleBookmark({
                        id: `bookmark-${resource.id}`,
                        entityId: resource.id,
                        entityType: "resource",
                      })
                    }
                  >
                    {saved ? "Remove bookmark" : "Bookmark"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No matching resources"
          description="Adjust your search or filters to continue."
        />
      )}
    </div>
  );
}

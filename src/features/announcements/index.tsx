"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge, Button, Card } from "@/components/ui";
import { engagementService } from "@/services/demo";
import { useAppStore } from "@/stores/app-store";

export function AnnouncementsFeature() {
  const [query, setQuery] = useState("");
  const announcements = engagementService.listAnnouncements();
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);
  const bookmarks = useAppStore((state) => state.bookmarks);

  const filtered = announcements.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <PageHeader title="Announcements" description="Pinned, searchable updates from SRC, campus, and clubs." />
      <SearchInput value={query} onChange={setQuery} placeholder="Search announcements" />
      <div className="space-y-3">
        {filtered.map((announcement) => {
          const saved = bookmarks.some((item) => item.entityId === announcement.id && item.entityType === "announcement");
          return (
            <Card key={announcement.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{announcement.title}</h2>
                  <p className="text-sm text-slate-600">{announcement.content}</p>
                </div>
                {announcement.pinned ? <Badge tone="gold">Pinned</Badge> : null}
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/announcements/${announcement.id}`}>
                  <Button size="sm" variant="secondary">View</Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => toggleBookmark({ id: `b-${announcement.id}`, entityId: announcement.id, entityType: "announcement" })}>
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

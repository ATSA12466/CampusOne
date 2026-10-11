"use client";
import { useState } from "react";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, Pagination, SegmentedControl, Select } from "@/components/ui";
import { images } from "@/config/images";
import { appConfig } from "@/config/app-config";
import { useCampusFeed } from "@/features/campus-feed/hooks/use-campus-feed";
import { useCampusActivity } from "@/features/campus-feed/hooks/use-campus-activity";
import { SourceFeedback } from "@/features/campus-feed/components/source-feedback";
import { AnnouncementCard } from "./components/announcement-card";
import type { CampusFeed } from "@/types/campus-feed";
export function AnnouncementsFeature({
  initial,
}: {
  initial: CampusFeed<"announcements">;
}) {
  const feed = useCampusFeed("announcements", initial),
    activity = useCampusActivity(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [view, setView] = useState("all"),
    [page, setPage] = useState(1);
  const items = feed.items
      .filter(
        (i) =>
          (category === "all" || i.category === category) &&
          (view !== "saved" || activity.savedAnnouncementIds.includes(i.id)) &&
          `${i.title} ${i.content}`.toLowerCase().includes(query.toLowerCase()),
      )
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.publishedAt.localeCompare(a.publishedAt) ||
          a.id.localeCompare(b.id),
      ),
    pages = Math.max(1, Math.ceil(items.length / 6)),
    current = Math.min(page, pages);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <MagazineHeader
        eyebrow="FROM AROUND CAMPUS"
        title="A little news. A bigger picture."
        description="The useful updates, shared ideas and campus conversations worth knowing about."
        image={images.clubDebate}
      />
      {appConfig.dataSource === "demo" ? (
        <p className="text-xs text-muted-foreground">
          Fictional demo updates, not official university announcements.
          Generated category covers are not photographs of these updates.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_200px_auto]">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search announcements"
        />
        <Select
          aria-label="Announcement category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All categories</option>
          <option value="src">SRC</option>
          <option value="campus">Campus</option>
          <option value="club">Clubs</option>
        </Select>
        <SegmentedControl
          label="Announcement view"
          value={view}
          onValueChange={(v) => {
            setView(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All updates" },
            { value: "saved", label: "Saved" },
          ]}
        />
      </div>
      <SourceFeedback
        count={feed.items.length}
        total={feed.total}
        error={feed.failure || feed.error}
        more={feed.hasMore}
        busy={feed.busy}
        retry={() => void feed.retry()}
        load={() => void feed.load(true)}
      />
      {activity.error ? (
        <div role="alert">
          <p>{activity.error}</p>
          <Button onClick={activity.refresh}>Retry private activity</Button>
        </div>
      ) : null}
      {activity.notice ? (
        <p role="status" className="text-sm text-muted-foreground">
          {activity.notice}
        </p>
      ) : null}
      {view === "saved" && activity.loading ? (
        <p role="status">Loading your saved updates…</p>
      ) : items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.slice((current - 1) * 6, current * 6).map((item) => (
            <AnnouncementCard key={item.id} item={item} activity={activity} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            view === "saved" && !activity.ready
              ? "Sign in to collect useful updates"
              : feed.error
                ? "Updates need another moment"
                : "No updates in this view"
          }
          description="Search and Saved apply to loaded updates. Change the filters or retry an unavailable source."
        />
      )}
      <Pagination page={current} totalPages={pages} onPageChange={setPage} />
    </div>
  );
}

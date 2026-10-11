"use client";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, Select, Pagination } from "@/components/ui";
import { images } from "@/config/images";
import { useCampusFeed } from "@/features/campus-feed/hooks/use-campus-feed";
import { SourceFeedback } from "@/features/campus-feed/components/source-feedback";
import { useDiscoverActivity } from "@/features/discover/hooks/use-discover-activity";
import { useDiscoverSave } from "@/features/discover/hooks/use-discover-save";
import { MediaCard } from "./components/media-card";
import type { CampusFeed } from "@/types/campus-feed";
export function MediaFeature({ initial }: { initial: CampusFeed<"media"> }) {
  const ready = useAuthStore((s) => !!s.user && s.hydrated);
  const feed = useCampusFeed("media", initial),
    activity = useDiscoverActivity(),
    action = useDiscoverSave(activity.refresh),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState("all"),
    [active, setActive] = useState(""),
    [page, setPage] = useState(1),
    items = feed.items.filter(
      (i) =>
        (kind === "all" || i.kind === kind) &&
        `${i.title} ${i.creator}`.toLowerCase().includes(query.toLowerCase()),
    ),
    pages = Math.max(1, Math.ceil(items.length / 6)),
    current = Math.min(page, pages);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <MagazineHeader
        eyebrow="TAKE A LITTLE PAUSE"
        title="Listen. Look. Find a new perspective."
        description="A media library with honest availability and a few licensed playback samples."
        image={images.mediaPause}
      />
      <p className="text-xs text-muted-foreground">
        Demo titles are not actual recordings. Only supplied, allowed media
        sources can play; licensed samples are clearly identified. Playback is
        user-initiated, never autoplay.
      </p>
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search media"
        />
        <Select
          aria-label="Media format"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All formats</option>
          <option value="podcast">Podcasts</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </Select>
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
          <Button onClick={activity.refresh}>Retry saved items</Button>
        </div>
      ) : null}
      {action.error ? (
        <p role="alert" className="text-danger">
          {action.error}
        </p>
      ) : null}
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {items.slice((current - 1) * 6, current * 6).map((i) => (
            <MediaCard
              key={i.id}
              item={i}
              active={active === i.id}
              open={() => setActive(i.id)}
              saved={activity.saved.some(
                (s) => s.category === "media" && s.id === i.id,
              )}
              ready={ready && !activity.loading && !activity.error}
              action={action}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No media in this view"
          description="Change the format or search. Unavailable sources can be retried above."
        />
      )}
      <Pagination page={current} totalPages={pages} onPageChange={setPage} />
    </div>
  );
}

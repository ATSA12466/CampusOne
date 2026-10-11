"use client";
import Link from "next/link";
import { CampusImage } from "@/components/media/campus-image";
import { Badge, Button, Card } from "@/components/ui";
import { images } from "@/config/images";
import { campusActionService } from "@/services";
import type { Announcement } from "@/types";
import type { CampusActivityState } from "@/features/campus-feed/hooks/use-campus-activity";
export function AnnouncementCard({
  item,
  activity,
}: {
  item: Announcement;
  activity: CampusActivityState;
}) {
  const saved = activity.savedAnnouncementIds.includes(item.id),
    cover =
      item.category === "src"
        ? images.clubDebate
        : item.category === "club"
          ? images.clubService
          : images.campusLife;
  return (
    <Card padding="none" className="flex h-full flex-col overflow-hidden">
      <CampusImage
        image={cover}
        aspect="video"
        sizes="(max-width:639px) 100vw, (max-width:1023px) 50vw, 33vw"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{item.category}</Badge>
          {item.pinned ? <Badge tone="gold">Pinned</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Published {item.publishedAt} · Category illustration
        </p>
        <h2 className="font-display text-xl font-semibold">
          <Link
            href={`/announcements/${encodeURIComponent(item.id)}`}
            className="inline-flex min-h-11 items-center"
          >
            {item.title}
          </Link>
        </h2>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {item.content}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <Link
            className="inline-flex min-h-11 items-center text-sm font-semibold text-brand"
            href={`/announcements/${encodeURIComponent(item.id)}`}
          >
            Read update →
          </Link>
          <Button
            size="sm"
            variant="secondary"
            aria-pressed={saved}
            aria-label={`${saved ? "Unsave" : "Save"} ${item.title}`}
            disabled={
              !activity.ready ||
              activity.loading ||
              !!activity.error ||
              activity.busy
            }
            onClick={() =>
              void activity.run((signal) =>
                campusActionService.saveAnnouncement(item.id, !saved, {
                  signal,
                }),
              )
            }
          >
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

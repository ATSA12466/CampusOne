"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge, Button, Card } from "@/components/ui";
import { mediaService } from "@/services";
import { useAppStore } from "@/stores/app-store";

export function MediaFeature() {
  const items = mediaService.listMedia();
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Media & Podcasts"
        description="Motivational and educational media content."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{item.title}</h2>
              <Badge tone="primary">{item.kind}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.creator} • {item.duration}
            </p>
            <div className="mt-3">
              {item.kind === "podcast" || item.kind === "audio" ? (
                item.source ? (
                  <audio
                    controls
                    className="w-full"
                    src={item.source}
                    onPlay={() => setCurrentAudio(item.id)}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">Audio source unavailable in demo.</p>
                )
              ) : (
                <p className="text-xs text-muted-foreground">
                  Video preview available. Playback requires connected media source.
                </p>
              )}
            </div>
            <Button
              className="mt-3"
              size="sm"
              variant="secondary"
              onClick={() =>
                toggleBookmark({
                  id: `bm-${item.id}`,
                  entityId: item.id,
                  entityType: "media",
                })
              }
            >
              {bookmarks.some(
                (bookmark) => bookmark.entityId === item.id && bookmark.entityType === "media",
              )
                ? "Bookmarked"
                : "Bookmark"}
            </Button>
          </Card>
        ))}
      </div>
      {currentAudio ? (
        <p className="text-xs text-muted-foreground">Now playing demo media item: {currentAudio}</p>
      ) : null}
    </div>
  );
}

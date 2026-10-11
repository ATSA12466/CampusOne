"use client";
import { CampusImage } from "@/components/media/campus-image";
import { Badge, Button, Card } from "@/components/ui";
import { discoverMedia } from "@/services/discover/map-life";
import { isAllowedPlaybackSrc } from "@/config/media";
import { campusPause } from "@/config/media";
import { discoverKey } from "@/lib/discover/directory";
import type { MediaItem } from "@/types";
import type { DiscoverSaveState } from "@/features/discover/hooks/use-discover-save";
export function MediaCard({
  item,
  saved,
  ready,
  action,
  active,
  open,
}: {
  item: MediaItem;
  saved: boolean;
  ready: boolean;
  action: DiscoverSaveState;
  active: boolean;
  open: () => void;
}) {
  const normalized = discoverMedia(item),
    pending = action.busy?.key === discoverKey(normalized),
    source =
      item.source && isAllowedPlaybackSrc(item.source) ? item.source : null;
  return (
    <Card padding="none" className="overflow-hidden">
      <CampusImage
        image={normalized.cover}
        aspect="video"
        sizes="(max-width:639px) 100vw, 50vw"
      />
      <div className="space-y-4 p-5">
        <Badge tone="primary">{item.kind}</Badge>
        <h2 className="font-display text-xl font-semibold">{item.title}</h2>
        <p className="text-xs text-muted-foreground">
          {item.creator} · {item.duration} ·{" "}
          {normalized.illustrative ? "Category illustration" : "Supplied cover"}
        </p>
        {source ? (
          <>
            <p className="text-sm text-muted-foreground">
              Licensed CC0 playback demonstration. Not a GCTU recording or a
              student podcast.
            </p>
            {active ? (
              <div className="rounded-control border border-border p-3">
                {item.kind === "video" ? (
                  <video
                    controls
                    preload="metadata"
                    className="w-full rounded-control"
                    aria-label={item.title}
                    src={source}
                  >
                    <track
                      kind="captions"
                      src={campusPause.captions}
                      srcLang="en"
                      label="English visual description"
                      default
                    />
                  </video>
                ) : (
                  <audio
                    controls
                    preload="metadata"
                    className="w-full"
                    aria-label={item.title}
                    src={source}
                  />
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  {item.kind === "video"
                    ? campusPause.transcript
                    : "A short dinosaur-roar sound effect, without spoken words. Use the player to pause or adjust volume."}
                </p>
              </div>
            ) : (
              <Button variant="secondary" onClick={open}>
                Open sample player
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No playable recording was supplied. The listed duration is demo
            metadata, not an available file.
          </p>
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={!ready || !!action.busy}
          aria-pressed={pending ? action.busy?.goal : saved}
          aria-label={`${saved ? "Unsave" : "Save"} ${item.title}`}
          onClick={() => void action.save(normalized, !saved)}
        >
          {pending ? "Saving…" : saved ? "Saved" : "Save for later"}
        </Button>
      </div>
    </Card>
  );
}

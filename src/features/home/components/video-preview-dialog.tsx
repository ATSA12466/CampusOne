"use client";
import { useState, type RefObject } from "react";
import { Dialog } from "@/components/ui/dialog";
import { campusPause } from "@/config/media";
import { Button } from "@/components/ui/button";
import { isAllowedImageSrc } from "@/config/image-policy";
import type { FeaturedContentItem } from "@/types/home";
export function VideoPreviewDialog({
  item,
  open,
  onOpenChange,
  returnFocusRef,
}: {
  item: FeaturedContentItem;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  const isSample = item.mediaSource === campusPause.src;
  const safe = item.mediaSource && isAllowedImageSrc(item.mediaSource);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      returnFocusRef={returnFocusRef}
      title={item.title}
      description={
        isSample
          ? "A labelled demonstration media preview. Nothing plays automatically."
          : "Press play when you are ready. Nothing plays automatically."
      }
      className="max-w-3xl"
    >
      {safe && !failed ? (
        <video
          key={attempt}
          controls
          src={item.mediaSource}
          playsInline
          preload="metadata"
          poster={isAllowedImageSrc(item.thumbnail) ? item.thumbnail : undefined}
          className="aspect-video w-full rounded-control bg-nav"
          aria-label={`${item.title} video preview`}
          onError={() => setFailed(true)}
        >
          {item.captionsSource && isAllowedImageSrc(item.captionsSource) ? (
            <track
              kind="captions"
              src={item.captionsSource}
              srcLang="en"
              label="English visual description"
              default
            />
          ) : null}
          Your browser does not support this video.
        </video>
      ) : (
        <div role="alert" className="rounded-control bg-danger-soft p-4 text-danger">
          <p>The video couldn&apos;t load. Try again or read the text alternative below.</p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            Retry video
          </Button>
        </div>
      )}
      <div className="mt-4 rounded-control bg-surface-muted p-4">
        <p className="text-xs font-semibold">Text alternative</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {item.transcript ?? "A text description has not been supplied for this media."}
        </p>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {item.creator}
          {isSample ? " · Local licensed sample, not campus footage" : ""}
        </p>
      </div>
    </Dialog>
  );
}

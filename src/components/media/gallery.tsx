"use client";

import { ArrowLeft, ArrowRight, Expand } from "lucide-react";
import { useRef, useState } from "react";
import { Carousel } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CampusImage } from "./campus-image";
import type { CampusMedia } from "@/types/media";

export function Gallery({ images, label }: { images: readonly CampusMedia[]; label: string }) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const change = (direction: number) =>
    setSelected((current) => (current + direction + images.length) % images.length);
  if (!images.length)
    return <CampusImage alt={`${label} — no photographs yet`} className="rounded-media" />;
  return (
    <>
      <Carousel label={label}>
        {images.map((image, index) => (
          <button
            type="button"
            key={`${image.src}-${index}`}
            aria-label={`View photo ${index + 1} of ${images.length} in full screen`}
            className="group relative block w-full text-left"
            onClick={(event) => {
              lastTrigger.current = event.currentTarget;
              setSelected(index);
              setOpen(true);
            }}
          >
            <CampusImage
              image={image}
              className="rounded-media"
              sizes="(max-width: 767px) 100vw, 700px"
            />
            <span
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-control bg-nav/70 text-on-photo"
              aria-hidden="true"
            >
              <Expand className="size-5" />
            </span>
          </button>
        ))}
      </Carousel>
      <Dialog
        title={label}
        description="Use the arrow buttons or left and right keys to browse. Press Escape to close."
        kind="lightbox"
        open={open}
        onOpenChange={setOpen}
        returnFocusRef={lastTrigger}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            change(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            change(-1);
          }
        }}
      >
        <CampusImage
          image={images[selected]}
          aspect="video"
          fit="contain"
          sizes="(max-width: 1023px) 100vw, 1000px"
          className="rounded-control"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            size="icon"
            variant="secondary"
            disabled={images.length === 1}
            onClick={() => change(-1)}
            aria-label="Previous photo"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Photo {selected + 1} of {images.length}
          </p>
          <Button
            size="icon"
            variant="secondary"
            disabled={images.length === 1}
            onClick={() => change(1)}
            aria-label="Next photo"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </Dialog>
    </>
  );
}

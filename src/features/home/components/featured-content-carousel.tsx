"use client";

import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { FeaturedContentItem } from "@/types";
import { useFeaturedContent } from "../hooks/use-featured-content";
import { CarouselControls } from "./carousel-controls";
import { CarouselIndicators } from "./carousel-indicators";
import { FeaturedContentSlide } from "./featured-content-slide";

const SWIPE_THRESHOLD = 45;

export function FeaturedContentCarousel({ items }: { items: FeaturedContentItem[] }) {
  const { current, index, previous, next, setIndex } = useFeaturedContent(items);
  const pointerStartX = useRef<number | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    },
    [next, previous],
  );

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    pointerStartX.current = event.clientX;
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (pointerStartX.current === null) return;
    const delta = event.clientX - pointerStartX.current;
    if (delta > SWIPE_THRESHOLD) previous();
    if (delta < -SWIPE_THRESHOLD) next();
    pointerStartX.current = null;
  };

  if (!current) {
    return null;
  }

  return (
    <section
      aria-label="Featured content carousel"
      className="space-y-3"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Featured for you</h2>
        <CarouselControls onPrevious={previous} onNext={next} />
      </div>
      <FeaturedContentSlide item={current} />
      <CarouselIndicators items={items} activeIndex={index} onSelect={setIndex} />
    </section>
  );
}

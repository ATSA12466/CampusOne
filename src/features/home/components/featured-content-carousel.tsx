"use client";
import type { ReactNode } from "react";
import { campusDate } from "@/lib/home/schedule";
import { useHomeClock } from "../hooks/use-home-clock";
import { Carousel } from "@/components/ui/carousel";
export function FeaturedContentCarousel({
  children,
  activeUntil = [],
}: {
  children: readonly ReactNode[];
  activeUntil?: readonly (string | undefined)[];
}) {
  const today = campusDate(useHomeClock());
  const active = children.filter((_, index) => !activeUntil[index] || activeUntil[index]! >= today);
  if (!active.length) return null;
  return (
    <section aria-label="Featured ads and video" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
          On the campus radar
        </h2>
        <span className="text-[11px] text-muted-foreground">Curated for your day</span>
      </div>
      <Carousel label="Featured ads and video" className="home-featured">
        {active}
      </Carousel>
    </section>
  );
}

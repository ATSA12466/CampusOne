"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cva } from "class-variance-authority";
import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

const indicator = cva("size-2 rounded-full transition-all", {
  variants: { active: { true: "w-6 bg-brand", false: "bg-subtle-foreground" } },
  defaultVariants: { active: false },
});
export function Carousel({
  label,
  children,
  className,
  onActiveChange,
}: {
  label: string;
  children: readonly ReactNode[];
  className?: string;
  onActiveChange?: (index: number) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const id = useId();
  const [index, setIndex] = useState(0);
  const active = Math.min(index, Math.max(0, children.length - 1));
  const goTo = (candidate: number) => {
    const target = Math.max(0, Math.min(candidate, children.length - 1));
    const node = viewport.current;
    const child = node?.children.item(target);
    if (!node || !(child instanceof HTMLElement)) return;
    const first = node.children.item(0);
    const origin = first instanceof HTMLElement ? first.offsetLeft : 0;
    node.scrollTo({
      left: child.offsetLeft - origin,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  const handleScroll = () => {
    const node = viewport.current;
    if (!node) return;
    const next = Math.max(
      0,
      Math.min(Math.round(node.scrollLeft / Math.max(1, node.clientWidth)), children.length - 1),
    );
    setIndex(next);
    onActiveChange?.(next);
  };
  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      <div
        ref={viewport}
        id={id}
        role="region"
        aria-label={label}
        aria-roledescription="carousel"
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(active + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
        className="relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-media [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, position) => (
          <div
            key={position}
            role="group"
            aria-roledescription="slide"
            aria-label={`${position + 1} of ${children.length}`}
            className="min-w-0 shrink-0 basis-full snap-start"
          >
            {child}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="icon"
          disabled={active === 0}
          onClick={() => goTo(active - 1)}
          aria-label="Previous slide"
          aria-controls={id}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <div
          className="flex min-w-0 flex-1 justify-center overflow-x-auto"
          aria-label="Slide navigation"
        >
          {children.map((_, position) => (
            <button
              key={position}
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-control"
              onClick={() => goTo(position)}
              aria-label={`Go to slide ${position + 1}`}
              aria-controls={id}
              aria-current={position === active ? "true" : undefined}
            >
              <span className={indicator({ active: position === active })} aria-hidden="true" />
            </button>
          ))}
        </div>
        <Button
          variant="secondary"
          size="icon"
          disabled={active >= children.length - 1}
          onClick={() => goTo(active + 1)}
          aria-label="Next slide"
          aria-controls={id}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {active + 1} of {children.length}
      </p>
    </div>
  );
}

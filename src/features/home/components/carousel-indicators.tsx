import { cn } from "@/lib/utils/cn";
import type { FeaturedContentItem } from "@/types";

export function CarouselIndicators({
  items,
  activeIndex,
  onSelect,
}: {
  items: FeaturedContentItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Featured content slides">
      {items.map((item, idx) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={idx === activeIndex}
          aria-label={`Go to slide ${idx + 1}: ${item.title}`}
          className={cn(
            "h-2.5 rounded-full transition-all",
            idx === activeIndex ? "w-7 bg-[var(--color-royal-blue)]" : "w-2.5 bg-slate-300",
          )}
          onClick={() => onSelect(idx)}
        />
      ))}
    </div>
  );
}

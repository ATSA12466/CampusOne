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
    <div className="flex max-w-full flex-wrap gap-1" aria-label="Featured content slides">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          aria-current={index === activeIndex ? "true" : undefined}
          aria-label={`Go to slide ${index + 1}: ${item.title}`}
          className="grid size-11 place-items-center rounded-control"
          onClick={() => onSelect(index)}
        >
          <span
            className={cn(
              "h-2 rounded-full transition-all",
              index === activeIndex ? "w-6 bg-brand" : "w-2 bg-subtle-foreground",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

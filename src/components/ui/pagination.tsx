"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label = "Results pages",
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  const count = Math.max(1, Math.floor(totalPages));
  const current = Math.min(count, Math.max(1, page));
  const pages = [...new Set([1, current - 1, current, current + 1, count])]
    .filter((value) => value >= 1 && value <= count)
    .sort((a, b) => a - b);
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous page"
        disabled={current === 1}
        onClick={() => onPageChange(current - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      {pages.map((value, index) => (
        <span key={value} className="flex items-center">
          {index > 0 && value - pages[index - 1] > 1 ? (
            <span
              className="grid size-11 place-items-center text-muted-foreground"
              aria-hidden="true"
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </span>
          ) : null}
          <Button
            variant={value === current ? "primary" : "ghost"}
            size="icon"
            aria-label={`Page ${value}`}
            aria-current={value === current ? "page" : undefined}
            onClick={() => onPageChange(value)}
          >
            {value}
          </Button>
        </span>
      ))}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next page"
        disabled={current === count}
        onClick={() => onPageChange(current + 1)}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

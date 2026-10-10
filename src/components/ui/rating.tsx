"use client";

import * as Primitive from "@radix-ui/react-radio-group";
import { Star } from "lucide-react";
import { cva } from "class-variance-authority";

const star = cva("size-5", {
  variants: { filled: { true: "fill-accent text-warning", false: "text-subtle-foreground" } },
});
export function Rating({
  value,
  onValueChange,
  label = "Rating",
}: {
  value: number;
  onValueChange?: (value: number) => void;
  label?: string;
}) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  if (!onValueChange)
    return (
      <span
        role="img"
        aria-label={`${label}: ${value} out of 5`}
        className="inline-flex items-center gap-1"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className={star({ filled: index < rounded })} aria-hidden="true" />
        ))}
        <span className="ml-2 text-sm font-semibold" aria-hidden="true">
          {value.toFixed(1)}
        </span>
      </span>
    );
  return (
    <Primitive.Root
      aria-label={label}
      orientation="horizontal"
      value={String(rounded)}
      onValueChange={(next) => onValueChange(Number(next))}
      className="flex"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Primitive.Item
          key={index}
          value={String(index + 1)}
          className="grid size-11 place-items-center rounded-control"
          aria-label={`${index + 1} out of 5`}
        >
          <Star className={star({ filled: index < rounded })} aria-hidden="true" />
        </Primitive.Item>
      ))}
    </Primitive.Root>
  );
}

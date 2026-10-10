"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import type { ChoiceOption } from "@/types/ui";

const variants = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "border-brand/30 bg-brand-soft text-brand",
        false:
          "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-foreground",
      },
    },
    defaultVariants: { selected: false },
  },
);
export function Chip({
  selected = false,
  className,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof variants>) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      className={cn(variants({ selected }), className)}
      {...props}
    />
  );
}
export function FilterBar({
  label,
  options,
  value,
  onValueChange,
  className,
}: {
  label: string;
  options: readonly ChoiceOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex max-w-full gap-2 overflow-x-auto py-1 [scrollbar-width:thin]", className)}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={option.value === value}
          onClick={() => onValueChange(option.value)}
        >
          {option.icon}
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

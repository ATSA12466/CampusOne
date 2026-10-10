"use client";

import * as Primitive from "@radix-ui/react-radio-group";
import { cva } from "class-variance-authority";
import type { ChoiceOption } from "@/types/ui";
import { cn } from "@/lib/utils/cn";

const item = cva(
  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control px-3 text-sm font-semibold text-muted-foreground transition-colors data-[state=checked]:bg-surface-raised data-[state=checked]:text-foreground data-[state=checked]:shadow-low disabled:opacity-50",
);
export function SegmentedControl({
  label,
  options,
  value,
  onValueChange,
  className,
  disabled,
}: {
  label: string;
  options: readonly ChoiceOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Primitive.Root
      aria-label={label}
      orientation="horizontal"
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className={cn("inline-flex max-w-full gap-1 rounded-card bg-surface-muted p-1", className)}
    >
      {options.map((option) => (
        <Primitive.Item key={option.value} value={option.value} className={item()}>
          {option.icon}
          <span>{option.label}</span>
        </Primitive.Item>
      ))}
    </Primitive.Root>
  );
}

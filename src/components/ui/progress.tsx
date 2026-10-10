"use client";

import * as Primitive from "@radix-ui/react-progress";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const track = cva("overflow-hidden rounded-full bg-surface-inset", {
  variants: { size: { sm: "h-1.5", md: "h-2.5" } },
  defaultVariants: { size: "md" },
});
export function Progress({
  value,
  label,
  size,
  showValue = true,
  className,
}: {
  value: number;
  label: string;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}) {
  const percent = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className={cn("space-y-2", className)}>
      {showValue ? (
        <div className="flex justify-between gap-3 text-xs">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">{Math.round(percent)}%</span>
        </div>
      ) : null}
      <Primitive.Root value={percent} max={100} aria-label={label} className={track({ size })}>
        <Primitive.Indicator
          className="h-full w-full rounded-full bg-brand transition-transform duration-200"
          style={{ transform: `translateX(-${100 - percent}%)` }}
        />
      </Primitive.Root>
    </div>
  );
}

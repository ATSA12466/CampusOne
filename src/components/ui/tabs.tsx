"use client";

import * as Primitive from "@radix-ui/react-tabs";
import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const trigger = cva("relative min-h-11 shrink-0 px-4 text-sm font-semibold transition-colors", {
  variants: {
    variant: {
      underline:
        "text-muted-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 data-[state=active]:text-brand data-[state=active]:after:bg-brand",
      pill: "rounded-control text-muted-foreground data-[state=active]:bg-surface-raised data-[state=active]:text-foreground data-[state=active]:shadow-low",
    },
  },
  defaultVariants: { variant: "underline" },
});
export function Tabs({
  label,
  tabs,
  value,
  defaultValue,
  onValueChange,
  variant = "underline",
  className,
}: {
  label: string;
  tabs: readonly { value: string; label: string; content: ReactNode }[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "underline" | "pill";
  className?: string;
}) {
  return (
    <Primitive.Root
      value={value}
      defaultValue={defaultValue ?? tabs[0]?.value}
      onValueChange={onValueChange}
      className={className}
    >
      <Primitive.List
        aria-label={label}
        className={cn(
          "flex max-w-full overflow-x-auto",
          variant === "pill" ? "gap-1 rounded-card bg-surface-muted p-1" : "border-b border-border",
        )}
      >
        {tabs.map((tab) => (
          <Primitive.Trigger key={tab.value} value={tab.value} className={trigger({ variant })}>
            {tab.label}
          </Primitive.Trigger>
        ))}
      </Primitive.List>
      {tabs.map((tab) => (
        <Primitive.Content key={tab.value} value={tab.value} className="pt-5 outline-offset-4">
          {tab.content}
        </Primitive.Content>
      ))}
    </Primitive.Root>
  );
}

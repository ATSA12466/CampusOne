"use client";

import { CloudOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function ErrorState({
  title = "A small pause, not a dead end.",
  description = "We couldn't load this part of campus. Your work is still here — give it another try.",
  onRetry,
  className,
  heading: Heading = "h3",
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  heading?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-media border border-border bg-surface px-6 py-8 text-center",
        className,
      )}
    >
      <span className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
        <CloudOff className="size-7" aria-hidden="true" />
      </span>
      <Heading className="font-display text-xl font-semibold">{title}</Heading>
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { HomeCollection } from "@/types/home";
export function HomeDataFeedback({
  unavailable,
  truncated,
}: {
  unavailable: readonly HomeCollection[];
  truncated: readonly HomeCollection[];
}) {
  const router = useRouter(),
    [pending, refresh] = useTransition();
  if (!unavailable.length && !truncated.length) return null;
  return (
    <div
      role={unavailable.length ? "alert" : "status"}
      className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-warning-soft p-4 text-sm text-warning"
    >
      <p className="min-w-0 flex-1">
        {unavailable.length
          ? `Some Home sections couldn't load (${unavailable.join(", ")}). Other sections and shortcuts still work.`
          : "This is a bounded feed preview. Full pages may have more; the timetable preview may not contain every session."}
      </p>
      {unavailable.length ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          aria-label="Retry home feed"
          onClick={() => refresh(() => router.refresh())}
        >
          {pending ? "Refreshing…" : "Try again"}
        </Button>
      ) : null}
    </div>
  );
}

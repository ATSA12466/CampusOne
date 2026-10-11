"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useHomeClock } from "../hooks/use-home-clock";
export function WelcomeHeader() {
  const user = useAuthStore((state) => state.user),
    now = useHomeClock();
  const name = user?.name.trim().split(/\s+/)[0] ?? "friend";
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Accra",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-brand uppercase">
          Your daily campus edit <span className="mx-2 text-border">/</span> GCTU
        </p>
        <h1 className="font-display text-title font-semibold tracking-tight">Your campus edit.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {greeting}, <span className="font-semibold text-foreground">{name}</span>.{" "}
          <time dateTime={now.toISOString()}>
            {new Intl.DateTimeFormat("en-GH", {
              timeZone: "Africa/Accra",
              weekday: "long",
              day: "numeric",
              month: "short",
            }).format(now)}
          </time>
        </p>
      </div>
      <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
        <Link prefetch={false} href="/tasks">
          <Plus className="size-4" aria-hidden="true" /> Add a task
        </Link>
      </Button>
    </header>
  );
}

"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarCheck, MapPin, Sparkles, Users } from "lucide-react";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CampusImage } from "@/components/media/campus-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { images } from "@/config/images";
import { clubCover } from "@/lib/clubs/media";
import { clubCategoryLabel } from "@/lib/clubs/category";
import type { CampusFeed } from "@/types/campus-feed";
import type { Club } from "@/types";

const interests = [
  "All interests",
  "Technology",
  "Arts & culture",
  "Sports",
  "Faith",
  "Service",
  "Academic",
  "Media",
] as const;

const firstWeek = [
  {
    title: "Complete your profile",
    detail: "Add your programme, level and interests so classmates can find you.",
    href: "/profile",
  },
  {
    title: "Join one community",
    detail: "Start with a single club or group — depth beats a dozen sign-ups.",
    href: "/clubs",
  },
  {
    title: "Attend a welcome event",
    detail: "Orientation meet-ups are the easiest place to make first friends.",
    href: "/events",
  },
  {
    title: "Plan your first week",
    detail: "Put your lectures and one social thing on the timetable.",
    href: "/timetable",
  },
] as const;

function matchesInterest(club: Club, interest: string) {
  if (interest === "All interests") return true;
  const haystack = `${club.name} ${club.description} ${club.category ?? ""}`.toLowerCase();
  const keywords: Record<string, string[]> = {
    Technology: ["tech", "code", "robot", "software", "digital", "innovation"],
    "Arts & culture": ["art", "music", "dance", "drama", "culture", "creative", "choir"],
    Sports: ["sport", "football", "basket", "athlet", "fitness", "game"],
    Faith: ["faith", "christian", "muslim", "fellowship", "chapel", "mosque"],
    Service: ["service", "volunteer", "community", "outreach", "rotaract", "leo"],
    Academic: ["academic", "debate", "study", "research", "science", "engineering"],
    Media: ["media", "press", "photo", "film", "radio", "content"],
  };
  return (keywords[interest] ?? []).some((word) => haystack.includes(word));
}

export function FreshersFeature({ initial }: { initial: CampusFeed<"clubs"> }) {
  const router = useRouter();
  const [interest, setInterest] = useState<string>("All interests");
  const [done, setDone] = useState<readonly string[]>([]);
  const clubs = useMemo(
    () => initial.items.filter((club) => matchesInterest(club, interest)).slice(0, 6),
    [initial.items, interest],
  );
  const toggle = (title: string) =>
    setDone((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]));

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <MagazineHeader
        eyebrow="FRESHERS HUB"
        title="Find your people from day one."
        description="Akwaaba to GCTU. Meet students who share your interests, join a group that feels like home, and settle into campus life one small step at a time."
        image={images.studentAma}
      />

      <section aria-labelledby="freshers-checklist" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-widest text-brand uppercase">Your first week</p>
            <h2 id="freshers-checklist" className="font-display text-title">
              Four small steps, one settled fresher.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {done.length} of {firstWeek.length} done · ticks stay on this device
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2">
          {firstWeek.map((step) => {
            const checked = done.includes(step.title);
            return (
              <li key={step.title}>
                <Card
                  className={`flex h-full flex-col gap-2 p-5 ${checked ? "border-success/40 bg-success-soft/40" : ""}`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(step.title)}
                      className="mt-1 size-5 shrink-0 accent-(--brand)"
                    />
                    <span>
                      <span className={`block font-semibold ${checked ? "line-through opacity-70" : ""}`}>
                        {step.title}
                      </span>
                      <span className="block text-sm text-muted-foreground">{step.detail}</span>
                    </span>
                  </label>
                  <Link
                    prefetch={false}
                    href={step.href}
                    className="mt-auto inline-flex w-fit items-center gap-1 text-sm font-semibold text-brand hover:underline"
                  >
                    Start <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="freshers-groups" className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-brand uppercase">Interest groups</p>
          <h2 id="freshers-groups" className="font-display text-title">
            Communities that match your energy.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Filter by interest, then open a club to see its people, events and how to join.
            Connection requests and group chats arrive with the full Freshers Hub in Phase 8.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by interest">
          {interests.map((item) => (
            <Chip key={item} selected={interest === item} onClick={() => setInterest(item)}>
              {item}
            </Chip>
          ))}
        </div>
        {initial.error ? (
          <ErrorState
            title="Groups could not load"
            description={initial.error}
            onRetry={() => router.refresh()}
          />
        ) : clubs.length === 0 ? (
          <EmptyState
            title="No groups match that interest yet"
            description="Try another interest, or browse the full club directory."
            action={
              <Button asChild variant="secondary">
                <Link prefetch={false} href="/clubs">
                  Browse all clubs
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <li key={club.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-low">
                  <div className="relative aspect-[16/9]">
                    <CampusImage
                      image={clubCover(club)}
                      aspect="video"
                      sizes="(max-width:1023px) 100vw, 360px"
                      className="absolute inset-0 h-full w-full aspect-auto"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-center gap-2">
                      <Badge tone="primary">{clubCategoryLabel(club.category)}</Badge>
                      {typeof club.details?.memberCount === "number" && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3.5" aria-hidden="true" />
                          {club.details.memberCount} members
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-balance">{club.name}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{club.description}</p>
                    <Link
                      prefetch={false}
                      href={`/clubs/${club.id}`}
                      className="mt-auto inline-flex w-fit items-center gap-1 pt-1 text-sm font-semibold text-brand hover:underline"
                    >
                      Explore club <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="freshers-next" className="grid gap-3 md:grid-cols-3">
        <h2 id="freshers-next" className="sr-only">
          Keep settling in
        </h2>
        {[
          {
            icon: Sparkles,
            title: "Say hello to campus",
            detail: "Introduce yourself in the community feed and see what others are up to.",
            href: "/community",
            cta: "Open community",
          },
          {
            icon: CalendarCheck,
            title: "Never miss orientation",
            detail: "RSVP to welcome events and keep your ticket in one place.",
            href: "/events",
            cta: "Browse events",
          },
          {
            icon: MapPin,
            title: "Find your way around",
            detail: "Hostels, lecture halls, food spots — start with where you will live.",
            href: "/accommodation",
            cta: "Explore housing",
          },
        ].map((card) => (
          <Card key={card.title} className="flex flex-col gap-2 p-5">
            <card.icon className="size-6 text-brand" aria-hidden="true" />
            <h3 className="font-bold">{card.title}</h3>
            <p className="text-sm text-muted-foreground">{card.detail}</p>
            <Button asChild variant="secondary" className="mt-auto w-fit">
              <Link prefetch={false} href={card.href}>
                {card.cta}
              </Link>
            </Button>
          </Card>
        ))}
      </section>
    </div>
  );
}

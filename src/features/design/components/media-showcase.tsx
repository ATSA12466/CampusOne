"use client";

import Link from "next/link";
import { Bookmark, Compass, Users, CalendarDays, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { images } from "@/config/images";
import { MediaCard } from "@/components/media/media-card";
import { PhotoTile } from "@/components/media/photo-tile";
import { HeroBanner } from "@/components/media/hero-banner";
import { CampusImage } from "@/components/media/campus-image";
import { Gallery } from "@/components/media/gallery";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Club, EventItem } from "@/types";
import { ShowcaseSection } from "./showcase-section";
import { MediaAspectsPreview } from "./media-aspects-preview";

export function MediaShowcase({ clubs, events }: { clubs: Club[]; events: EventItem[] }) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  const save = () => {
    setSaved(!saved);
    toast({
      title: saved ? "Removed from saved" : "Saved for later",
      description: "Component demo only — no backend request.",
      tone: "success",
    });
  };
  return (
    <ShowcaseSection
      id="media"
      number="03"
      title="Life looks better, together."
      description="A photo carries the story. Facts stay clear, actions stay reachable. One image contract handles crops, responsive sizes, blur-up, missing photos and failures."
    >
      <HeroBanner
        image={images.campusLife}
        title="Your people. Your possibilities."
        description="A club to join. A conversation to start. A new side of campus waiting to be discovered."
        eyebrow="Campus life / hero banner"
      >
        <Button variant="gold" asChild>
          <Link href="/clubs">
            Find your people <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <Badge tone="photo">Generated scene</Badge>
      </HeroBanner>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <MediaCard
          title={clubs[0]?.name ?? "Code Collective"}
          eyebrow="Technology / media card"
          description={clubs[0]?.description ?? "Build something together."}
          image={images.campusLife}
          href={`/clubs/${clubs[0]?.id ?? "club-1"}`}
          facts={[
            { label: "Community", value: "128 members" },
            { label: "Meet up", value: "Fridays" },
          ]}
          action={
            <Button
              variant="ghost"
              size="icon"
              aria-label={saved ? "Unsave club preview" : "Save club preview"}
              aria-pressed={saved}
              onClick={save}
            >
              <Bookmark
                className={`size-5 ${saved ? "fill-current text-brand" : ""}`}
                aria-hidden="true"
              />
            </Button>
          }
        />
        <PhotoTile
          image={images.campusLife}
          title="Campus, after class."
          description="Clubs / featured photo tile"
          href="/clubs"
          icon={Users}
          featured
        />
        <PhotoTile
          image={images.examFocus}
          title={events[0]?.title ?? "Innovation Night"}
          description="Placeholder / photo tile"
          href="/events"
          icon={CalendarDays}
        />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-sm font-semibold">Swipe, explore, open a lightbox</h3>
          <Gallery
            label="Campus life gallery"
            images={[images.campusLife, images.clubCode, images.clubDebate]}
          />
        </div>
        <div className="space-y-5">
          <div>
            <h3 className="mb-4 text-sm font-semibold">A graceful fallback, not a broken frame</h3>
            <CampusImage image={images.unavailable} aspect="video" className="rounded-media" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <Avatar name="Ama Nyarko" image={images.studentAma} size="lg" />
              <div>
                <p className="text-sm font-semibold">People, not placeholders.</p>
                <p className="text-xs text-muted-foreground">
                  Generated portraits + branded initials
                </p>
              </div>
            </div>
            <AvatarStack
              people={[
                { name: "Ama", image: images.studentAma },
                { name: "Kojo", image: images.studentKojo },
                { name: "Esi Mensah" },
                { name: "Nana Owusu" },
              ]}
              total={24}
            />
          </div>
          <Button asChild variant="secondary">
            <Link href="/discover">
              <Compass className="size-4" aria-hidden="true" />
              Explore the current app
            </Link>
          </Button>
        </div>
      </div>
      <MediaAspectsPreview />
    </ShowcaseSection>
  );
}

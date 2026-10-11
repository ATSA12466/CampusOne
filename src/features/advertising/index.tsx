"use client";
import Link from "next/link";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CampusImage } from "@/components/media/campus-image";
import { Badge, Card } from "@/components/ui";
import { images } from "@/config/images";
import { useCampusFeed } from "@/features/campus-feed/hooks/use-campus-feed";
import { SourceFeedback } from "@/features/campus-feed/components/source-feedback";
import type { CampusFeed } from "@/types/campus-feed";
export function AdvertisingFeature({
  initial,
}: {
  initial: CampusFeed<"campaigns">;
}) {
  const feed = useCampusFeed("campaigns", initial);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <MagazineHeader
        eyebrow="CAMPUS PARTNERS"
        title="Good ideas deserve a little space."
        description="A transparent view of supplied promotional placements—not a publishing or billing console."
        image={images.campusMarket}
      />
      <SourceFeedback
        count={feed.items.length}
        total={feed.total}
        error={feed.failure || feed.error}
        busy={feed.busy}
        more={feed.hasMore}
        retry={() => void feed.retry()}
        load={() => void feed.load(true)}
      />
      <p className="text-xs text-muted-foreground">
        Fictional demo campaigns. Status is supplied metadata, not proof of live
        distribution, authorization, payment or impressions.
      </p>
      {feed.items.length ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {feed.items.map((c) => (
            <Card key={c.id} padding="none" className="overflow-hidden">
              <CampusImage
                image={images.studyCorner}
                aspect="video"
                sizes="(max-width:639px) 100vw, 50vw"
              />
              <div className="space-y-4 p-5">
                <Badge tone={c.status === "active" ? "success" : "warning"}>
                  {c.status}
                </Badge>
                <h2 className="font-display text-xl font-semibold">
                  {c.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {c.advertiser} · {c.placement}
                </p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt>Starts</dt>
                    <dd>{c.startDate}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Ends</dt>
                    <dd>{c.endDate}</dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Category illustration, not advertiser-supplied artwork.
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No loaded campaigns"
          description="Retry an unavailable source; no demo campaign is substituted in API mode."
        />
      )}
      <Link
        className="inline-flex min-h-11 items-center text-sm font-semibold text-brand"
        href="/home"
      >
        Explore the campus Home →
      </Link>
    </div>
  );
}

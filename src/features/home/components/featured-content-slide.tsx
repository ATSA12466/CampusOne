import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroBanner } from "@/components/media/hero-banner";
import { imageForSrc } from "@/config/images";
import type { FeaturedContentItem } from "@/types";

export function FeaturedContentSlide({ item }: { item: FeaturedContentItem }) {
  return (
    <HeroBanner
      image={imageForSrc(item.thumbnail)}
      title={item.title}
      description={item.description}
      eyebrow={`${item.type}${item.sponsored ? " · Sponsored (demo)" : ""}`}
      size="compact"
      priority
    >
      <Button asChild variant="overlay">
        <Link prefetch={false} href={item.destination}>
          {item.ctaLabel ?? "Open"}
        </Link>
      </Button>
      {item.duration ? <Badge tone="photo">{item.duration}</Badge> : null}
    </HeroBanner>
  );
}

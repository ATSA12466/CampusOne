import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/config/app-config";
import { imageForSrc } from "@/config/images";
import { VideoPreviewTrigger } from "./video-preview-trigger";
import type { FeaturedContentItem } from "@/types/home";
export function FeaturedContentSlide({
  item,
  priority = false,
}: {
  item: FeaturedContentItem;
  priority?: boolean;
}) {
  const sponsored = item.type === "sponsored" || item.sponsored;
  const thumbnail = imageForSrc(item.thumbnail);
  return (
    <article className="relative grid h-full min-h-56 overflow-hidden rounded-media border border-border bg-surface md:grid-cols-[1fr_1.65fr]">
      <div className="absolute inset-0 min-h-56 md:relative">
        <CampusImage
          image={
            thumbnail ?? {
              src: item.thumbnail,
              alt: item.thumbnailAlt,
              provenance: "upload",
            }
          }
          aspect="video"
          sizes="(max-width:767px) calc(100vw - 2rem), (max-width:1023px) 35vw, 360px"
          priority={priority}
          quality={60}
          className="absolute inset-0 h-full w-full"
        />
        <div className="photo-scrim absolute inset-0 md:hidden" aria-hidden="true" />
        <span className="absolute bottom-3 left-3 hidden md:block rounded-full bg-nav/85 px-2 py-1 text-[10px] text-on-photo">
          {thumbnail?.provenance === "generated"
            ? "Generated demo image"
            : thumbnail?.provenance === "licensed"
              ? "CC0 media sample"
              : "Publisher-provided image"}
        </span>
      </div>
      <div className="relative flex flex-col justify-center p-5 text-on-photo md:p-7 md:text-foreground">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone={sponsored ? "gold" : "primary"}>
            {sponsored
              ? appConfig.dataSource === "demo"
                ? "Sponsored · Demo"
                : "Sponsored"
              : "Video preview"}
          </Badge>
          <span className="text-[10px] text-on-photo/90 md:text-muted-foreground">
            {item.creator}
          </span>
        </div>
        <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          {item.title}
        </h3>
        <p className="mt-2 max-w-lg text-sm text-on-photo/90 md:text-muted-foreground">
          {item.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!sponsored && item.mediaSource ? (
            <VideoPreviewTrigger item={item} />
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link prefetch={false} href={item.destination}>
                {item.ctaLabel ?? "Explore"}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
          {item.duration ? (
            <span className="text-xs text-on-photo/90 md:text-muted-foreground">
              {item.duration}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

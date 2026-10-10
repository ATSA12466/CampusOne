import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { CampusImage } from "./campus-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { CampusMedia } from "@/types/media";

const variants = cva("relative isolate overflow-hidden rounded-media text-on-photo", {
  variants: { size: { compact: "min-h-72", large: "min-h-96 md:min-h-[440px]" } },
  defaultVariants: { size: "large" },
});
export function HeroBanner({
  image,
  title,
  description,
  eyebrow,
  children,
  size,
  priority = false,
  className,
  heading: Heading = "h2",
}: {
  image?: CampusMedia;
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
  size?: "compact" | "large";
  priority?: boolean;
  className?: string;
  heading?: "h1" | "h2" | "h3";
}) {
  return (
    <section className={cn(variants({ size }), className)}>
      <CampusImage
        image={image}
        alt={image?.alt ?? `${title} — hero photo unavailable`}
        aspect="panorama"
        className="absolute inset-0 h-full w-full"
        sizes="(max-width: 1279px) 100vw, 1200px"
        priority={priority}
      />
      <div className="photo-scrim hero-photo-scrim absolute inset-0" aria-hidden="true" />
      <div className="relative flex min-h-[inherit] flex-col justify-end p-6 md:p-10">
        <div className="max-w-2xl md:max-w-[55%]">
          {eyebrow ? (
            <Badge tone="photo" className="mb-5">
              {eyebrow}
            </Badge>
          ) : null}
          <Heading className="font-display text-title font-semibold text-balance">{title}</Heading>
          {description ? (
            <p className="mt-4 max-w-xl text-sm leading-relaxed md:text-base">{description}</p>
          ) : null}
          {children ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>
          ) : null}
        </div>
        {image?.provenance === "generated" ? (
          <p className="mt-8 max-w-2xl text-[11px] md:max-w-[55%]">
            Generated demo imagery · not an actual campus photograph
          </p>
        ) : null}
      </div>
    </section>
  );
}
